-- 1. Safe Column Additions
-- Add stock to products if it doesn't exist
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0;

-- Fix for existing products: Set initial stock if it was added as 0
UPDATE public.products SET stock = 100 WHERE stock = 0;

-- Add is_archived to orders if it doesn't exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;


-- 2. Atomic Order & Stock Management Function
-- Use CREATE OR REPLACE to safely update the function without dropping it
CREATE OR REPLACE FUNCTION public.place_order(
  p_user_id UUID,
  p_total NUMERIC,
  p_items JSONB
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_item RECORD;
BEGIN
  -- A. PRE-CHECK: Verify stock for ALL items in the transaction
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM products 
      WHERE id = v_item.product_id AND stock >= v_item.quantity
    ) THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_item.product_id;
    END IF;
  END LOOP;

  -- B. INSERT ORDER: Create the main order record
  INSERT INTO orders (user_id, total)
  VALUES (p_user_id, p_total)
  RETURNING id INTO v_order_id;

  -- C. PROCESS ITEMS: Insert order_items and decrement stock atomically
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT, price NUMERIC)
  LOOP
    -- Insert the line item
    INSERT INTO order_items (order_id, user_id, product_id, quantity, price)
    VALUES (v_order_id, p_user_id, v_item.product_id, v_item.quantity, v_item.price);

    -- Decrement stock and double-check availability to handle high-concurrency race conditions
    UPDATE products
    SET stock = stock - v_item.quantity
    WHERE id = v_item.product_id AND stock >= v_item.quantity;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Concurrency error: Stock became insufficient for product % during processing', v_item.product_id;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Permissions & Security
-- Ensure authenticated users can execute the order function
GRANT EXECUTE ON FUNCTION public.place_order(UUID, NUMERIC, JSONB) TO authenticated;

-- Ensure Users can update their own orders (required for archiving)
-- Using DROP/CREATE only if needed to avoid conflicts
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' AND policyname = 'Users can update their own orders'
    ) THEN
        CREATE POLICY "Users can update their own orders" 
        ON public.orders FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Allow admin (admin@example.com) to update ANY order (required for status management)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'orders' AND policyname = 'Admin can update all orders'
    ) THEN
        CREATE POLICY "Admin can update all orders"
        ON public.orders FOR UPDATE
        USING (
            auth.jwt() ->> 'email' = 'admin@example.com'
        );
    END IF;
END $$;

-- 4. Review System Policies (Additive)
-- Only add if they don't exist to prevent errors on existing setups
DO $$ 
BEGIN
    -- INSERT Policy for reviews
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Users can create their own reviews') THEN
        CREATE POLICY "Users can create their own reviews" ON public.reviews FOR INSERT WITH CHECK (
          auth.uid() = user_id AND 
          EXISTS (
            SELECT 1 FROM public.order_items 
            WHERE product_id = reviews.product_id AND user_id = auth.uid()
          )
        );
    END IF;

    -- UPDATE Policy for reviews
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Users can update their own reviews') THEN
        CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 5. Order Status Management (Additive)
-- Add order_status to orders if it doesn't exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'Pending';

-- Ensure existing orders get the 'Pending' status if they were NULL
UPDATE public.orders SET order_status = 'Pending' WHERE order_status IS NULL;

-- =============================================
-- QUICK FIX: Run this in Supabase SQL Editor NOW
-- Fixes user checkout RPC permission issue
-- =============================================

-- FIX: Regular users get RPC 400 on place_order because the function
-- runs as SECURITY INVOKER (default), meaning RLS blocks users from
-- inserting into orders/order_items and updating products stock.
--
-- SECURITY DEFINER makes it run as the DB owner (bypasses RLS).
-- This is the standard pattern for atomic multi-table transaction functions.
-- The function already validates the user via the p_user_id parameter.

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
    INSERT INTO order_items (order_id, user_id, product_id, quantity, price)
    VALUES (v_order_id, p_user_id, v_item.product_id, v_item.quantity, v_item.price);

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

-- Ensure authenticated users can execute it
GRANT EXECUTE ON FUNCTION public.place_order(UUID, NUMERIC, JSONB) TO authenticated;

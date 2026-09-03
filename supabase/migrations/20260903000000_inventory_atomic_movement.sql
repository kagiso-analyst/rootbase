-- Atomically update stock and record its movement.
CREATE OR REPLACE FUNCTION public.update_inventory_with_movement(
  p_item_id uuid,
  p_quantity numeric,
  p_type text,
  p_reason text,
  p_farm_id uuid,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_quantity numeric;
  new_quantity numeric;
  movement_id uuid;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 OR p_type NOT IN ('in', 'out') THEN
    RAISE EXCEPTION 'Invalid stock movement';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM farms WHERE id = p_farm_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Farm not found or access denied';
  END IF;

  SELECT COALESCE(current_quantity, 0) INTO current_quantity
  FROM inventory_items
  WHERE id = p_item_id AND farm_id = p_farm_id AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory item not found';
  END IF;

  new_quantity := CASE WHEN p_type = 'in'
    THEN current_quantity + p_quantity
    ELSE current_quantity - p_quantity
  END;

  IF new_quantity < 0 THEN
    RAISE EXCEPTION 'Insufficient stock';
  END IF;

  UPDATE inventory_items
  SET current_quantity = new_quantity, updated_at = now()
  WHERE id = p_item_id AND farm_id = p_farm_id AND user_id = auth.uid();

  INSERT INTO stock_movements (inventory_item_id, user_id, farm_id, quantity, type, reason, date)
  VALUES (p_item_id, auth.uid(), p_farm_id, p_quantity, p_type, p_reason, now())
  RETURNING id INTO movement_id;

  RETURN jsonb_build_object('movement_id', movement_id, 'current_quantity', new_quantity);
END;
$$;

REVOKE ALL ON FUNCTION public.update_inventory_with_movement(uuid, numeric, text, text, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_inventory_with_movement(uuid, numeric, text, text, uuid, uuid) TO authenticated;
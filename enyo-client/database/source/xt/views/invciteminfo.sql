select xt.create_view('xt.invciteminfo', $$

  -- select distinct on allows us to add the aggregated tax total column
  -- without having to inner join a temporarily grouped tax table or specify
  -- two dozen group-bys
  select distinct on (invcitem_id) invcitem.*, 
  case when invcitem_item_id = -1 then true else false end as invcitem_is_misc,
  invcitem_ordered * invcitem_qty_invuomratio 
    * (invcitem_price / invcitem_price_invuomratio) as invcitem_ext_price,
  max(taxhist_tax) as invcitem_tax_total
  from invcitem
  inner join invcitemtax on invcitem_id = taxhist_parent_id
  group by invcitem_id

$$, false);

create or replace rule "_INSERT" as on insert to xt.invciteminfo do instead

insert into invcitem (
  invcitem_id,
  invcitem_invchead_id,
  invcitem_linenumber,
  invcitem_item_id,
  invcitem_warehous_id,
  invcitem_custpn,
  invcitem_number,
  invcitem_descrip,
  invcitem_ordered,
  invcitem_billed,
  invcitem_custprice,
  invcitem_price,
  invcitem_notes,
  invcitem_salescat_id,
  invcitem_taxtype_id,
  invcitem_qty_uom_id,
  invcitem_qty_invuomratio,
  invcitem_price_uom_id,
  invcitem_price_invuomratio,
  invcitem_coitem_id,
  invcitem_updateinv,
  invcitem_rev_accnt_id,
  obj_uuid
) values (
  new.invcitem_id,
  new.invcitem_invchead_id,
  new.invcitem_linenumber,
  new.invcitem_item_id,
  new.invcitem_warehous_id,
  new.invcitem_custpn,
  new.invcitem_number,
  new.invcitem_descrip,
  new.invcitem_ordered,
  new.invcitem_billed,
  new.invcitem_custprice,
  new.invcitem_price,
  new.invcitem_notes,
  new.invcitem_salescat_id,
  new.invcitem_taxtype_id,
  new.invcitem_qty_uom_id,
  new.invcitem_qty_invuomratio,
  new.invcitem_price_uom_id,
  new.invcitem_price_invuomratio,
  new.invcitem_coitem_id,
  new.invcitem_updateinv,
  new.invcitem_rev_accnt_id,
  new.obj_uuid
);

create or replace rule "_UPDATE" as on update to xt.invciteminfo do instead

update invcitem set
  invcitem_id = new.invcitem_id,
  invcitem_invchead_id = new.invcitem_invchead_id,
  invcitem_linenumber = new.invcitem_linenumber,
  invcitem_item_id = new.invcitem_item_id,
  invcitem_warehous_id = new.invcitem_warehous_id,
  invcitem_custpn = new.invcitem_custpn,
  invcitem_number = new.invcitem_number,
  invcitem_descrip = new.invcitem_descrip,
  invcitem_ordered = new.invcitem_ordered,
  invcitem_billed = new.invcitem_billed,
  invcitem_custprice = new.invcitem_custprice,
  invcitem_price = new.invcitem_price,
  invcitem_notes = new.invcitem_notes,
  invcitem_salescat_id = new.invcitem_salescat_id,
  invcitem_taxtype_id = new.invcitem_taxtype_id,
  invcitem_qty_uom_id = new.invcitem_qty_uom_id,
  invcitem_qty_invuomratio = new.invcitem_qty_invuomratio,
  invcitem_price_uom_id = new.invcitem_price_uom_id,
  invcitem_price_invuomratio = new.invcitem_price_invuomratio,
  invcitem_coitem_id = new.invcitem_coitem_id,
  invcitem_updateinv = new.invcitem_updateinv,
  invcitem_rev_accnt_id = new.invcitem_rev_accnt_id,
  obj_uuid = new.obj_uuid 
where invcitem_id = old.invcitem_id;

create or replace rule "_DELETE" as on delete to xt.invciteminfo do instead

delete from invcitem where invcitem_id = old.invcitem_id;


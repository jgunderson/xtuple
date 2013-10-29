-- add uuid column here because there are views that need this
select xt.add_column('womatl','obj_uuid', 'text', 'default xt.generate_uuid()', 'public');
select xt.add_inheritance('womatl', 'xt.obj');
select xt.add_constraint('womatl', 'womatl_obj_uuid','unique(obj_uuid)', 'public');
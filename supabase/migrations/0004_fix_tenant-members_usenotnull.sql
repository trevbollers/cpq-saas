alter table tenants
alter column slug set not null;
add constraint tenants_slug_key unique (slug);
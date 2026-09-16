-- Drei Testkonten für den lokalen Durchlauf. Passwort ist in stub.js hinterlegt.
insert into auth.users (id, instance_id, aud, role, email) values
 ('aaaaaaaa-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','holding@test.invalid'),
 ('aaaaaaaa-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','digital@test.invalid'),
 ('aaaaaaaa-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','industrie@test.invalid')
on conflict (id) do nothing;
-- handle_new_user() hat die Profile beim Einfuegen oben schon angelegt, nur
-- ohne Namen. Deshalb hier aktualisieren statt ueberspringen.
insert into profiles (id, email, full_name) values
 ('aaaaaaaa-0000-4000-8000-000000000001','holding@test.invalid','A. Holding'),
 ('aaaaaaaa-0000-4000-8000-000000000002','digital@test.invalid','B. Digital'),
 ('aaaaaaaa-0000-4000-8000-000000000003','industrie@test.invalid','C. Industrie')
on conflict (id) do update set full_name = excluded.full_name, email = excluded.email;
insert into memberships (user_id, company_id, role) values
 ('aaaaaaaa-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','owner'),
 ('aaaaaaaa-0000-4000-8000-000000000002','22222222-2222-4222-8222-222222222222','admin'),
 ('aaaaaaaa-0000-4000-8000-000000000003','33333333-3333-4333-8333-333333333333','editor')
on conflict do nothing;

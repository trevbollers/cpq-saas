create policy "allow authenticated inserts"
on profiles
for insert
to authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Job owner can update applications"
ON public.applications
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM jobs WHERE jobs.id = applications.job_id AND jobs.user_id = auth.uid()
));
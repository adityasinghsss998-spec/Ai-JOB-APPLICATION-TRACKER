import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { detectFormFieldsFn, submitJobApplicationFn } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    detectFormFieldsFn,
    submitJobApplicationFn,
  ],
});

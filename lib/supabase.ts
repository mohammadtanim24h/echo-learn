import { auth } from "@clerk/nextjs/server";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = () =>
    createBrowserClient(supabaseUrl!, supabaseKey!, {
        async accessToken() {
            return (await auth()).getToken();
        },
    });

"use server";

import { CreateCompanion } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "../supabase";

export const createCompanion = async (formData: CreateCompanion) => {
    const { userId: author } = await auth();
    const supabase = createClient();

    const { data, error } = await supabase
        .from("companions")
        .insert({ ...formData, author })
        .select();

    if (error || !data)
        throw new Error(error?.message || "Failed to create companion");
    return data[0];
};

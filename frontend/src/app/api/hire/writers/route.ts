import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabase();

    // Fetch eligible writers:
    // Criteria: available_for_hire = true OR is_verified_writer = true OR they are in founding_writers
    // For simplicity, we query users where available_for_hire is true or is_verified_writer is true
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select(`
        id,
        name,
        email,
        avatar_url,
        bio,
        is_verified_writer,
        available_for_hire
      `)
      .or('available_for_hire.eq.true,is_verified_writer.eq.true');

    if (usersError) {
      throw usersError;
    }

    // Fetch founding writers
    const { data: foundingData, error: foundingError } = await supabase
      .from("founding_writers")
      .select('user_id')
      .eq("status", "Accepted");

    if (foundingError) {
      throw foundingError;
    }

    const foundingUserIds = new Set(foundingData.map(fw => fw.user_id));

    // Combine users who are either verified/available or founding writers
    const allUsers = usersData || [];
    
    // We also need to fetch users who are ONLY founding writers but not in our first query
    const missingFoundingIds = foundingData
      .map(fw => fw.user_id)
      .filter(id => !allUsers.some(u => u.id === id));
      
    if (missingFoundingIds.length > 0) {
      const { data: missingUsers, error: missingError } = await supabase
        .from("users")
        .select(`
          id,
          name,
          email,
          avatar_url,
          bio,
          is_verified_writer,
          available_for_hire
        `)
        .in('id', missingFoundingIds);
        
      if (!missingError && missingUsers) {
        allUsers.push(...missingUsers);
      }
    }

    // Now fetch services for these users
    const writerIds = allUsers.map(u => u.id);
    const servicesByWriter: Record<string, any[]> = {};
    
    if (writerIds.length > 0) {
      const { data: servicesData, error: servicesError } = await supabase
        .from("writer_services")
        .select('*')
        .in('writer_id', writerIds);
        
      if (!servicesError && servicesData) {
        servicesData.forEach(service => {
          if (!servicesByWriter[service.writer_id]) {
            servicesByWriter[service.writer_id] = [];
          }
          servicesByWriter[service.writer_id].push(service);
        });
      }
    }

    // Map the response to a clean freelancer profile structure
    const freelancers = allUsers.map((user: any) => {
      const isFounding = foundingUserIds.has(user.id);
      
      return {
        id: user.id,
        name: user.name || user.email?.split('@')[0],
        email: user.email,
        avatar_url: user.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
        bio: user.bio,
        is_founding_writer: isFounding,
        is_verified_writer: user.is_verified_writer || false,
        available_for_hire: user.available_for_hire || false,
        services: servicesByWriter[user.id] || [],
      };
    });

    return NextResponse.json({ data: freelancers }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch freelancers error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

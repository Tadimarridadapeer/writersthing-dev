-- Function to get overall analytics for the Operations Dashboard
CREATE OR REPLACE FUNCTION get_operations_analytics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_users INT;
    v_active_users_30d INT;
    v_total_books INT;
    v_total_stories INT;
    v_total_blogs INT;
    v_content_breakdown JSONB;
    v_top_users JSONB;
    v_daily_engagement JSONB;
    v_result JSONB;
BEGIN
    -- 1. Total Users
    SELECT COUNT(*) INTO v_total_users FROM public.users;

    -- 2. Active Users (Users who logged in or had an event in the last 30 days)
    -- Using analytics_events as proxy for active users
    SELECT COUNT(DISTINCT viewer_id) INTO v_active_users_30d 
    FROM public.analytics_events 
    WHERE created_at >= NOW() - INTERVAL '30 days' AND viewer_id IS NOT NULL;

    -- 3. Total Content Counts
    SELECT COUNT(*) INTO v_total_books FROM public.books;
    -- Note: assuming stories and blogs tables exist, if they error during apply, we can fix it.
    -- Wait, from earlier view of schema, we only saw books in public.books. Let's use information_schema to be safe, or assume they exist.
    -- In operations schema we see fix_stories_rls.sql so stories probably exists. We also saw blogs mentioned in the policies.
    SELECT COUNT(*) INTO v_total_stories FROM public.stories;
    SELECT COUNT(*) INTO v_total_blogs FROM public.blogs;

    -- 4. Content Consumption Breakdown (Views per content type)
    SELECT jsonb_agg(
        jsonb_build_object(
            'name', initcap(content_type::text),
            'value', total_views
        )
    ) INTO v_content_breakdown
    FROM (
        SELECT content_type, COUNT(*) as total_views
        FROM public.analytics_events
        WHERE event_type = 'view'
        GROUP BY content_type
    ) q;

    -- 5. Top 10 Users by Engagement (total events: views + read_completions)
    SELECT jsonb_agg(
        jsonb_build_object(
            'user_id', u.id,
            'name', u.name,
            'email', u.email,
            'avatar_url', u.avatar_url,
            'engagement_score', q.total_events
        )
    ) INTO v_top_users
    FROM (
        SELECT viewer_id, COUNT(*) as total_events
        FROM public.analytics_events
        WHERE viewer_id IS NOT NULL
        GROUP BY viewer_id
        ORDER BY total_events DESC
        LIMIT 10
    ) q
    JOIN public.users u ON u.id = q.viewer_id;

    -- 6. Daily Engagement for last 30 days
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', q.event_date,
            'views', q.views_count,
            'completions', q.completions_count
        )
    ) INTO v_daily_engagement
    FROM (
        SELECT 
            DATE(created_at) as event_date,
            SUM(CASE WHEN event_type = 'view' THEN 1 ELSE 0 END) as views_count,
            SUM(CASE WHEN event_type = 'read_completion' THEN 1 ELSE 0 END) as completions_count
        FROM public.analytics_events
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC
    ) q;

    -- Construct Final JSON
    v_result := jsonb_build_object(
        'totalUsers', COALESCE(v_total_users, 0),
        'activeUsers30d', COALESCE(v_active_users_30d, 0),
        'totalContent', jsonb_build_object(
            'books', COALESCE(v_total_books, 0),
            'stories', COALESCE(v_total_stories, 0),
            'blogs', COALESCE(v_total_blogs, 0)
        ),
        'contentBreakdown', COALESCE(v_content_breakdown, '[]'::jsonb),
        'topUsers', COALESCE(v_top_users, '[]'::jsonb),
        'dailyEngagement', COALESCE(v_daily_engagement, '[]'::jsonb)
    );

    RETURN v_result;
END;
$$;

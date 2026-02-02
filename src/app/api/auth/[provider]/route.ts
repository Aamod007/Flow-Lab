import { NextRequest, NextResponse } from 'next/server'

export async function GET(
    req: NextRequest,
    { params }: { params: { provider: string } }
) {
    const provider = params.provider.toLowerCase()
    const redirectUri = `${process.env.NEXT_PUBLIC_URL}/api/auth/callback/${provider}`

    // ==========================================
    // COMPREHENSIVE OAUTH CONFIGURATION FOR 46 APPS
    // ==========================================
    const authConfig: Record<string, { url: string; params: Record<string, string> }> = {

        // --- Google Ecosystem ---
        'google-drive': {
            url: 'https://accounts.google.com/o/oauth2/v2/auth',
            params: {
                client_id: process.env.GOOGLE_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.profile email',
                access_type: 'offline',
                prompt: 'consent',
            },
        },
        'gmail': {
            url: 'https://accounts.google.com/o/oauth2/v2/auth',
            params: {
                client_id: process.env.GOOGLE_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly',
                access_type: 'offline',
            },
        },
        'google-sheets': {
            url: 'https://accounts.google.com/o/oauth2/v2/auth',
            params: {
                client_id: process.env.GOOGLE_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'https://www.googleapis.com/auth/spreadsheets',
                access_type: 'offline',
            },
        },
        'google-calendar': {
            url: 'https://accounts.google.com/o/oauth2/v2/auth',
            params: {
                client_id: process.env.GOOGLE_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'https://www.googleapis.com/auth/calendar',
                access_type: 'offline',
            },
        },
        'google-forms': {
            url: 'https://accounts.google.com/o/oauth2/v2/auth',
            params: {
                client_id: process.env.GOOGLE_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'https://www.googleapis.com/auth/forms.body.readonly',
                access_type: 'offline',
            },
        },

        // --- Communication ---
        'discord': {
            url: 'https://discord.com/api/oauth2/authorize',
            params: {
                client_id: process.env.DISCORD_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'identify email guilds webhook.incoming',
            },
        },
        'slack': {
            url: 'https://slack.com/oauth/v2/authorize',
            params: {
                client_id: process.env.SLACK_CLIENT_ID!,
                redirect_uri: redirectUri,
                scope: 'chat:write,channels:read,groups:read,mpim:read,im:read',
                user_scope: 'identity.basic',
            },
        },
        'microsoft-teams': {
            url: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
            params: {
                client_id: process.env.MICROSOFT_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'User.Read Team.ReadBasic.All ChannelMessage.Send',
                response_mode: 'query',
            },
        },
        'telegram': {
            // Telegram uses a widget/bot login, redirect to instructions or custom auth page
            url: `${process.env.NEXT_PUBLIC_URL}/connections/auth/telegram`,
            params: {},
        },
        'whatsapp': {
            url: 'https://www.facebook.com/v18.0/dialog/oauth',
            params: {
                client_id: process.env.META_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'whatsapp_business_messaging',
            },
        },

        // --- Productivity & PM ---
        'notion': {
            url: 'https://api.notion.com/v1/oauth/authorize',
            params: {
                client_id: process.env.NOTION_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
                owner: 'user',
            },
        },
        'airtable': {
            url: 'https://airtable.com/oauth2/v1/authorize',
            params: {
                client_id: process.env.AIRTABLE_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'data.records:read data.records:write schema.bases:read',
                code_challenge_method: 'S256',
            },
        },
        'trello': {
            url: 'https://trello.com/1/authorize',
            params: {
                key: process.env.TRELLO_KEY!,
                return_url: redirectUri,
                name: 'Flowlab',
                expiration: 'never',
                scope: 'read,write',
                response_type: 'token',
            },
        },
        'asana': {
            url: 'https://app.asana.com/-/oauth_authorize',
            params: {
                client_id: process.env.ASANA_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
            },
        },
        'jira': {
            url: 'https://auth.atlassian.com/authorize',
            params: {
                audience: 'api.atlassian.com',
                client_id: process.env.JIRA_CLIENT_ID!,
                scope: 'read:jira-work write:jira-work offline_access',
                redirect_uri: redirectUri,
                response_type: 'code',
                prompt: 'consent',
            },
        },
        'linear': {
            url: 'https://linear.app/oauth/authorize',
            params: {
                client_id: process.env.LINEAR_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'read write',
            },
        },
        'monday.com': {
            url: 'https://auth.monday.com/oauth2/authorize',
            params: {
                client_id: process.env.MONDAY_CLIENT_ID!,
                redirect_uri: redirectUri,
            },
        },

        // --- Development ---
        'github': {
            url: 'https://github.com/login/oauth/authorize',
            params: {
                client_id: process.env.GITHUB_CLIENT_ID!,
                redirect_uri: redirectUri,
                scope: 'repo user',
            },
        },
        'gitlab': {
            url: 'https://gitlab.com/oauth/authorize',
            params: {
                client_id: process.env.GITLAB_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'api read_user',
            },
        },

        // --- AI Services (Typically API Key, but some support OAuth or we redirect to input) ---
        'openai': {
            // Internal redirect to standard API Key input form
            url: `${process.env.NEXT_PUBLIC_URL}/connections/auth/openai`,
            params: {},
        },
        'anthropic': {
            url: `${process.env.NEXT_PUBLIC_URL}/connections/auth/anthropic`,
            params: {},
        },

        // --- CRM & Marketing ---
        'salesforce': {
            url: 'https://login.salesforce.com/services/oauth2/authorize',
            params: {
                client_id: process.env.SALESFORCE_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
            },
        },
        'hubspot': {
            url: 'https://app.hubspot.com/oauth/authorize',
            params: {
                client_id: process.env.HUBSPOT_CLIENT_ID!,
                redirect_uri: redirectUri,
                scope: 'crm.objects.contacts.read crm.objects.contacts.write',
            },
        },
        'mailchimp': {
            url: 'https://login.mailchimp.com/oauth2/authorize',
            params: {
                client_id: process.env.MAILCHIMP_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
            },
        },

        // --- E-commerce & Payments ---
        'stripe': {
            url: 'https://connect.stripe.com/oauth/authorize',
            params: {
                client_id: process.env.STRIPE_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'read_write',
            },
        },
        'paypal': {
            url: 'https://www.paypal.com/signin/authorize',
            params: {
                client_id: process.env.PAYPAL_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'openid profile email',
            },
        },
        'shopify': {
            // Shopify requires shop name in URL: https://{shop}.myshopify.com/admin/oauth/authorize
            // We handle this generic redirect to a shop input form first
            url: `${process.env.NEXT_PUBLIC_URL}/connections/auth/shopify`,
            params: {},
        },
        'woocommerce': {
            url: `${process.env.NEXT_PUBLIC_URL}/connections/auth/woocommerce`,
            params: {},
        },

        // --- Social ---
        'twitter': {
            url: 'https://twitter.com/i/oauth2/authorize',
            params: {
                client_id: process.env.TWITTER_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'tweet.read tweet.write users.read offline.access',
                code_challenge: 'challenge',
                code_challenge_method: 'plain',
            },
        },
        'linkedin': {
            url: 'https://www.linkedin.com/oauth/v2/authorization',
            params: {
                client_id: process.env.LINKEDIN_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'r_liteprofile r_emailaddress w_member_social',
            },
        },
        'facebook': {
            url: 'https://www.facebook.com/v18.0/dialog/oauth',
            params: {
                client_id: process.env.META_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'pages_show_list,pages_read_engagement',
            },
        },
        'instagram': {
            url: 'https://api.instagram.com/oauth/authorize',
            params: {
                client_id: process.env.INSTAGRAM_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'user_profile,user_media',
            },
        },

        // --- Cloud Storage ---
        'dropbox': {
            url: 'https://www.dropbox.com/oauth2/authorize',
            params: {
                client_id: process.env.DROPBOX_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
            },
        },
        'onedrive': {
            url: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
            params: {
                client_id: process.env.MICROSOFT_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: 'Files.ReadWrite.All',
            },
        },
        'aws-s3': {
            // AWS uses Access Keys, not OAuth
            url: `${process.env.NEXT_PUBLIC_URL}/connections/auth/aws`,
            params: {},
        },

        // --- Databases (No OAuth, Direct Connection String) ---
        'postgresql': { url: `${process.env.NEXT_PUBLIC_URL}/connections/auth/database`, params: { type: 'postgres' } },
        'mysql': { url: `${process.env.NEXT_PUBLIC_URL}/connections/auth/database`, params: { type: 'mysql' } },
        'mongodb': { url: `${process.env.NEXT_PUBLIC_URL}/connections/auth/database`, params: { type: 'mongo' } },
        'supabase': { url: `${process.env.NEXT_PUBLIC_URL}/connections/auth/database`, params: { type: 'supabase' } },
        'firebase': { url: `${process.env.NEXT_PUBLIC_URL}/connections/auth/database`, params: { type: 'firebase' } },

        // --- Meetings ---
        'zoom': {
            url: 'https://zoom.us/oauth/authorize',
            params: {
                client_id: process.env.ZOOM_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
            },
        },
        'calendly': {
            url: 'https://auth.calendly.com/oauth/authorize',
            params: {
                client_id: process.env.CALENDLY_CLIENT_ID!,
                redirect_uri: redirectUri,
                response_type: 'code',
            },
        },

        // --- Utils ---
        'typeform': {
            url: 'https://api.typeform.com/oauth/authorize',
            params: {
                client_id: process.env.TYPEFORM_CLIENT_ID!,
                redirect_uri: redirectUri,
                scope: 'forms:read responses:read',
            },
        },
        'twilio': { url: `${process.env.NEXT_PUBLIC_URL}/connections/auth/twilio`, params: {} },
    }

    const config = authConfig[provider]

    if (!config) {
        // If provider not found or uses generic API key handling
        return NextResponse.json({ error: `Provider ${provider} not supported or requires manual key entry` }, { status: 400 })
    }

    // If internal redirect (for API key forms)
    if (config.url.startsWith(process.env.NEXT_PUBLIC_URL!)) {
        return NextResponse.redirect(config.url)
    }

    // Construct OAuth URL
    const query = new URLSearchParams(config.params).toString()
    const redirectUrl = `${config.url}?${query}`

    return NextResponse.redirect(redirectUrl)
}

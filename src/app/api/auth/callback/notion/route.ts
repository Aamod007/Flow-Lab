import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent('No code provided')}`);
  }

  try {
    console.log('Notion OAuth: Exchanging code for token...');
    console.log('NOTION_CLIENT_ID:', process.env.NOTION_CLIENT_ID ? 'SET' : 'MISSING');
    console.log('NOTION_API_SECRET:', process.env.NOTION_API_SECRET ? 'SET' : 'MISSING');
    console.log('NOTION_REDIRECT_URI:', process.env.NOTION_REDIRECT_URI);
    console.log('NEXT_PUBLIC_URL:', baseUrl);

    const encoded = Buffer.from(
      `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_API_SECRET}`
    ).toString('base64');

    const response = await axios('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
        Authorization: `Basic ${encoded}`,
        'Notion-Version': '2022-06-28',
      },
      data: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.NOTION_REDIRECT_URI!,
      }),
    });

    console.log('Notion OAuth response received');

    if (response.data) {
      const notion = new Client({
        auth: response.data.access_token,
      });

      const databasesPages = await notion.search({
        filter: {
          value: 'database',
          property: 'object',
        },
        sort: {
          direction: 'ascending',
          timestamp: 'last_edited_time',
        },
      });

      const databaseId = databasesPages?.results?.length && databasesPages.results[0]
        ? databasesPages.results[0].id
        : '';

      console.log('Notion OAuth success! Redirecting to connections page...');

      return NextResponse.redirect(
        `${baseUrl}/connections?access_token=${response.data.access_token}&workspace_name=${response.data.workspace_name}&workspace_icon=${response.data.workspace_icon}&workspace_id=${response.data.workspace_id}&database_id=${databaseId}`
      );
    }
  } catch (error: any) {
    console.error('Notion OAuth error:', error?.response?.data || error.message);
    const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'OAuth failed';
    return NextResponse.redirect(
      `${baseUrl}/connections?error=${encodeURIComponent(errorMessage)}`
    );
  }

  return NextResponse.redirect(`${baseUrl}/connections`);
}

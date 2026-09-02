// app/api/team/invite/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Secure token generation
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // ✅ Verify authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, role, farmId } = await request.json()

    // ✅ Validate input
    if (!email || !role || !farmId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // ✅ Verify user has permission to invite
    const { data: currentMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('farm_id', farmId)
      .eq('user_id', user.id)
      .single()

    if (!currentMember || (currentMember.role !== 'owner' && currentMember.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { data: farm, error: farmError } = await supabase
      .from('farms')
      .select('name')
      .eq('id', farmId)
      .maybeSingle()

    if (farmError || !farm) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 })
    }

    // ✅ Check if user already a member
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('farm_id', farmId)
      .eq('email', email)
      .maybeSingle()

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a team member' }, { status: 400 })
    }

    // ✅ Check for pending invitation
    const { data: existingInvite } = await supabase
      .from('invitations')
      .select('id')
      .eq('farm_id', farmId)
      .eq('email', email)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (existingInvite) {
      return NextResponse.json({ error: 'Invitation already sent' }, { status: 400 })
    }

    // ✅ Check if user exists in profiles
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', email)
      .maybeSingle()

    // ✅ Create invitation with secure token
    const token = generateSecureToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    if (existingUser) {
      // Add existing user directly
      const { error: addError } = await supabase
        .from('team_members')
        .insert([{
          farm_id: farmId,
          user_id: existingUser.user_id,
          role: role,
          status: 'active',
          invited_by: user.id,
          email: email,
        }])

      if (addError) {
        return NextResponse.json({ error: addError.message }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'User added to team successfully' 
      })
    }

    // Create invitation
    const { error: inviteError } = await supabase
      .from('invitations')
      .insert([{
        email,
        farm_id: farmId,
        role,
        invited_by: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      }])

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    // ✅ Send email via Edge Function
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteUrl = `${appUrl}/accept-invitation?token=${token}`

    const { error: emailError } = await supabase.functions.invoke('send-invitation', {
      body: {
        email,
        inviteUrl,
        farmName: farm.name,
        role,
        senderName: user.email,
      }
    })

    if (emailError) {
      console.error('Email sending failed:', emailError)
      // Still return success since invitation was created
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Invitation sent successfully' 
    })

  } catch (error) {
    console.error('Invite API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
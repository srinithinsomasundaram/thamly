import { createClient } from "./client"

export async function fetchGoogleProfileImage(userId: string): Promise<string | null> {
  try {
    const supabase = createClient()

    // Get user identities to find Google provider
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Error fetching user:', userError)
      return null
    }

    // Check if user has Google identity
    const identities = user.identities
    const googleIdentity = identities?.find(identity => identity.provider === 'google')

    if (googleIdentity && googleIdentity.identity_data) {
      const googleData = googleIdentity.identity_data as any
      const avatarUrl = googleData.picture || googleData.avatar_url

      if (avatarUrl) {
        // Update profile with Google avatar if it exists
        const { error: updateError } = await (supabase
          .from('profiles') as any)
          .update({
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (updateError) {
          console.error('Error updating profile with Google avatar:', updateError)
        }

        return avatarUrl
      }
    }

    return null
  } catch (error) {
    console.error('Error fetching Google profile image:', error)
    return null
  }
}

export async function syncGoogleProfileData(userId: string) {
  try {
    const supabase = createClient()

    // Get current user data
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Error fetching user:', userError)
      return
    }

    // Check if user has Google identity
    const identities = user.identities
    const googleIdentity = identities?.find(identity => identity.provider === 'google')

    if (googleIdentity && googleIdentity.identity_data) {
      const googleData = googleIdentity.identity_data as any
      const avatarUrl = googleData.picture || googleData.avatar_url
      const fullName = googleData.name || user.user_metadata?.full_name

      // Update profile with Google data
      const profileData: any = {
        updated_at: new Date().toISOString()
      }

      if (avatarUrl) profileData.avatar_url = avatarUrl
      if (fullName) profileData.full_name = fullName

      const { error: updateError } = await (supabase
        .from('profiles') as any)
        .upsert({
          id: userId,
          email: user.email!,
          ...profileData
        }, { onConflict: 'id' })

      if (updateError) {
        console.error('Error syncing Google profile data:', updateError)
      }
    }
  } catch (error) {
    console.error('Error syncing Google profile data:', error)
  }
}
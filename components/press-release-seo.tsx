interface PressReleaseSEOProps {
  title: string
  description: string
  publishDate: string
  modifiedDate?: string
  organization: string
  organizationLogo: string
  contactEmail: string
  contactPhone: string
  location: string
  language?: string
  embargo?: string
  keywords?: string[]
}

export function PressReleaseStructuredData({
  title,
  description,
  publishDate,
  modifiedDate,
  organization,
  organizationLogo,
  contactEmail,
  contactPhone,
  location,
  language = "en",
  embargo,
  keywords = []
}: PressReleaseSEOProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": title,
    "description": description,
    "image": [organizationLogo],
    "datePublished": publishDate,
    "dateModified": modifiedDate || publishDate,
    "author": {
      "@type": "Organization",
      "name": organization,
      "logo": {
        "@type": "ImageObject",
        "url": organizationLogo
      }
    },
    "publisher": {
      "@type": "Organization",
      "name": organization,
      "logo": {
        "@type": "ImageObject",
        "url": organizationLogo
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://thamly.ai`
    },
    "articleSection": "Technology",
    "keywords": keywords.join(", "),
    "inLanguage": language,
    "isAccessibleForFree": true,
    "genre": ["Technology", "Press Release"],
    "about": {
      "@type": "Thing",
      "name": "Tamil Writing Assistant",
      "description": "AI-powered tool for Tamil writing and grammar checking"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": contactPhone,
      "contactType": "Media Relations",
      "email": contactEmail,
      "areaServed": "Worldwide",
      "availableLanguage": ["Tamil", "English", "Hindi"]
    },
    "locationCreated": {
      "@type": "Place",
      "name": location
    }
  }

  // Add embargo if provided
  if (embargo) {
    (structuredData as any)["embargoDate"] = embargo
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData)
      }}
    />
  )
}

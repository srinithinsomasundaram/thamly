import Head from 'next/head'

interface SEOProps {
  title: string
  description: string
  keywords?: string[]
  image?: string
  url?: string
  type?: string
  siteName?: string
  author?: string
  publishedTime?: string
  modifiedTime?: string
  articleSection?: string
  tags?: string[]
  canonical?: string
  noindex?: boolean
  structuredData?: object
}

export function SEO({
  title,
  description,
  keywords = [],
  image = '/og-image.jpg',
  url,
  type = 'website',
  siteName = 'Thamly - AI-Powered Tamil Writing Assistant',
  author = 'Thamly Team',
  publishedTime,
  modifiedTime,
  articleSection,
  tags = [],
  canonical,
  noindex = false,
  structuredData
}: SEOProps) {
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thamly.com'
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl
  const fullImageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`

  // Default structured data for organization
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Thamly",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "description": "AI-powered Tamil writing assistant that helps you write clear, mistake-free Tamil content",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-XXXXXXXXXX",
      "contactType": "customer service",
      "availableLanguage": ["Tamil", "English", "Hindi"]
    },
    "sameAs": [
      "https://twitter.com/thamly",
      "https://facebook.com/thamly",
      "https://linkedin.com/company/thamly",
      "https://instagram.com/thamly"
    ]
  }

  // Article structured data
  const articleStructuredData = type === 'article' ? {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": title,
    "description": description,
    "image": [fullImageUrl],
    "datePublished": publishedTime,
    "dateModified": modifiedTime || publishedTime,
    "author": {
      "@type": "Organization",
      "name": author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Thamly",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`
      }
    },
    "articleSection": articleSection || "Technology",
    "keywords": tags.join(", "),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": fullUrl
    }
  } : null

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content={author} />
      <link rel="canonical" href={canonical || fullUrl} />

      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={siteName} />
      {type === 'article' && <meta property="article:author" content={author} />}
      {type === 'article' && <meta property="article:section" content={articleSection} />}
      {type === 'article' && tags.map(tag => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:site" content="@thamly" />
      <meta name="twitter:creator" content="@thamly" />

      {/* Additional Meta Tags */}
      <meta name="language" content="Tamil" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="theme-color" content="#14b8a6" />

      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData || defaultStructuredData)
        }}
      />

      {articleStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(articleStructuredData)
          }}
        />
      )}
    </Head>
  )
}
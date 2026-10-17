-- =================================================================
-- SITE_CONTENT SEED SCRIPT: CANVAS, CONTACT, AFFILIATE
-- SUBQI STUDIO (Zero-Paid-SaaS Architecture)
-- =================================================================

-- 1. CANVAS (/canvas)
INSERT INTO public.site_content (category, page_path, section_id, sort_order, title, type, content, updated_at)
VALUES 
(
  'canvas', 
  '/canvas', 
  'CV01', 
  0, 
  '4-POINT BEZIER ENVELOPE DISTORTION', 
  'page', 
  '<p>Bend type along brutalist angles, perspective warps, circular arcs, and custom banners. Interactive 4-point Bézier cages maintain crisp contours without pixelation.</p>',
  NOW()
),
(
  'canvas', 
  '/canvas', 
  'CV02', 
  1, 
  'LINKED CHROMATIC STACKING SUITE', 
  'page', 
  '<p>Orchestrate multi-layer chromatic font families in real time. Base, Shadow, Inset, and Outline layers remain perfectly locked together during envelope transforms.</p>',
  NOW()
),
(
  'canvas', 
  '/canvas', 
  'CV03', 
  2, 
  'PERIMETER TRACK SLIDING & PEN ENGINE', 
  'page', 
  '<p>Attach lettering to arbitrary curved vectors or drawn shapes with the built-in Pen tool. Drag text along the perimeter track with live baseline alignment.</p>',
  NOW()
),
(
  'canvas', 
  '/canvas', 
  'CV04', 
  3, 
  'DIRECT VECTOR SVG & EPS EXPORT', 
  'page', 
  '<p>Export publication-ready mathematical vector curves directly into Adobe Illustrator, Figma, or laser-engraving setups with zero quality loss.</p>',
  NOW()
),
(
  'canvas', 
  '/canvas', 
  'CV05', 
  4, 
  'FONTCANVAS LAB SPECIFICATIONS', 
  'table', 
  '{
  "headers": [
    "FEATURE",
    "SPEC",
    "EXPORT_FORMAT"
  ],
  "rows": [
    [
      "Bézier Cage",
      "4-Point Realtime Warp",
      "Pure Vector SVG"
    ],
    [
      "Chromatic Sync",
      "Locked Bounding Box",
      "Multi-Layer Outlines"
    ],
    [
      "Path Engine",
      "Perimeter Sliding Track",
      "SVG Path Geometry"
    ],
    [
      "Glyph Coverage",
      "Full Map + Stylistic Sets",
      "Unsubsetted OpenType"
    ]
  ]
}',
  NOW()
),

-- 2. CONTACT (/contact)
(
  'contact', 
  '/contact', 
  'CT00', 
  0, 
  'DIRECT DISPATCH PROTOCOL', 
  'page', 
  '<p>To bypass domain spam filters and keep communication simple, all studio correspondence is managed directly via official Gmail: <b>subqistudio@gmail.com</b>.</p>',
  NOW()
),
(
  'contact', 
  '/contact', 
  'CT01', 
  1, 
  'STUDIO INQUIRIES & COMMISSION PHILOSOPHY', 
  'page', 
  '<p>Since Subqi Studio is a focused independent operation, you will get direct, prompt communication without corporate runarounds. We handle bespoke typefaces, custom modifications, and enterprise licensing.</p>',
  NOW()
),

-- 3. AFFILIATE (/affiliate)
(
  'affiliate', 
  '/affiliate', 
  'AF01', 
  0, 
  'CREATOR PARTNER TERMS & REVENUE SHARE', 
  'auto', 
  '<p>Partner with Subqi Studio. Share brutalist & experimental fonts with designers and agencies. Get paid directly to your PayPal account.</p>

{
  "headers": [
    "COMMISSION_RATE",
    "CLEARANCE_WINDOW",
    "PAYOUT_MINIMUM",
    "ATTRIBUTION_TRACK"
  ],
  "rows": [
    [
      "20% NET STORE",
      "14-DAY CLEARANCE",
      "$50.00 USD",
      "30-DAY COOKIE + COUPON"
    ]
  ]
}',
  NOW()
),
(
  'affiliate', 
  '/affiliate', 
  'AF02', 
  1, 
  'VANITY REFERRAL CODE & 10% AUDIENCE DISCOUNT', 
  'page', 
  '<p>Each partner gets a vanity link (<code>subqi.com/c/CODE</code>) and an automatic 10% discount coupon for followers. Either mechanism guarantees 100% accurate commission attribution.</p>',
  NOW()
),
(
  'affiliate', 
  '/affiliate', 
  'AF03', 
  2, 
  'AUTOMATIC PAYPAL PAYOUT SCHEDULE', 
  'page', 
  '<p>Commissions clear after 14 days and are paid out automatically via PayPal once the $50 threshold is met. Real-time metrics are tracked in your user dashboard.</p>',
  NOW()
)
ON CONFLICT DO NOTHING;

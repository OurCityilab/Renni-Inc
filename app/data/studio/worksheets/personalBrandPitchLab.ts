// Personal Brand & Pitch Lab — the seven individual worksheets.
//
// The uploaded PDF folder and filenames preserve the program's exact
// naming (Personal_Brand_Individual_Worksheets, Title_Case with
// underscores). Do NOT slugify or rename the files — only the route
// slugs are clean/lowercase.

export const PERSONAL_BRAND_WORKSHEETS_DIR =
  '/studio/worksheets/Personal_Brand_Individual_Worksheets'

export interface PersonalBrandWorksheet {
  number: number
  title: string
  /** Clean lowercase slug for in-app routes (/studio/lab/personal-brand/<slug>). */
  slug: string
  /** Exact uploaded filename — must match the PDF on disk byte-for-byte. */
  fileName: string
  pdfHref: string
}

function worksheet(
  number: number,
  title: string,
  slug: string,
  fileName: string
): PersonalBrandWorksheet {
  return { number, title, slug, fileName, pdfHref: `${PERSONAL_BRAND_WORKSHEETS_DIR}/${fileName}` }
}

export const personalBrandWorksheets: PersonalBrandWorksheet[] = [
  worksheet(1, 'Raw Material Dump', 'raw-material', 'Personal_Brand_Worksheet_1_Raw_Material_Dump.pdf'),
  worksheet(2, 'My Brand Ingredients', 'brand-ingredients', 'Personal_Brand_Worksheet_2_My_Brand_Ingredients.pdf'),
  worksheet(3, 'Brand Sentence Lab', 'brand-sentence', 'Personal_Brand_Worksheet_3_Brand_Sentence_Lab.pdf'),
  worksheet(4, 'Proof and Story Bank', 'proof-story-bank', 'Personal_Brand_Worksheet_4_Proof_and_Story_Bank.pdf'),
  worksheet(5, 'Pitch Builder', 'pitch-builder', 'Personal_Brand_Worksheet_5_Pitch_Builder.pdf'),
  worksheet(6, 'Peer Feedback', 'peer-feedback', 'Personal_Brand_Worksheet_6_Peer_Feedback.pdf'),
  worksheet(
    7,
    'LinkedIn / Resume Translation Exit Ticket',
    'resume-linkedin',
    'Personal_Brand_Worksheet_7_LinkedIn_Resume_Translation_Exit_Ticket.pdf'
  )
]

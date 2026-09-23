import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import { Box, Button, Chip, Container, Divider, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { researchNotes, type ResearchNote } from '../../content/researchData'
import { MotionReveal } from '../animations/MotionReveal'

function SectionHeading({ number, title, description }: { number: string; title: string; description?: string }) {
  return (
    <Box>
      <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center' }}>
        <Box sx={{ width: 29, height: 29, borderRadius: '50%', bgcolor: 'var(--wc-primary)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, fontFamily: 'var(--wc-font-data)', flexShrink: 0 }}>
          {number}
        </Box>
        <Typography variant="h2" sx={{ color: 'var(--wc-text-primary)', fontSize: { xs: '1.5rem', md: '1.85rem' }, lineHeight: 1.1 }}>
          {title}
        </Typography>
      </Stack>
      {description && <Typography sx={{ mt: 1.3, color: 'var(--wc-text-secondary)', fontSize: 14, lineHeight: 1.7 }}>{description}</Typography>}
    </Box>
  )
}

function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <TableContainer sx={{ border: '1px solid var(--wc-divider)', borderRadius: '7px', overflowX: 'auto', bgcolor: '#fff' }}>
      <Table size="small" sx={{ minWidth: 620 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: 'var(--wc-primary-light)' }}>
            {headers.map((header) => <TableCell key={header} sx={{ borderColor: 'var(--wc-divider)', color: 'var(--wc-primary)', fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', py: 1.45 }}>{header}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>{children}</TableBody>
      </Table>
    </TableContainer>
  )
}

function ResearchNoteView({ note }: { note: ResearchNote }) {
  return (
    <Stack spacing={{ xs: 5, md: 6 }}>
      <Box component="article" sx={{ border: '1px solid var(--wc-divider)', borderRadius: '10px', bgcolor: '#fff', overflow: 'hidden', boxShadow: 'var(--wc-shadow-card)' }}>
        <Box sx={{ p: { xs: 2.5, md: 4 }, bgcolor: '#071329', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(255,255,255,0.05), transparent 48%, rgba(36,88,215,0.28))', pointerEvents: 'none' }} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ position: 'relative', alignItems: { sm: 'flex-start' }, justifyContent: 'space-between' }}>
            <Box>
              <Typography sx={{ color: '#a8c5ff', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{note.ticker} · Equity Research</Typography>
              <Typography variant="h1" sx={{ mt: 1.5, color: '#fff', fontSize: { xs: '2rem', md: '3.1rem' }, lineHeight: 1, maxWidth: 760 }}>{note.company}</Typography>
              <Typography sx={{ mt: 1.2, color: 'rgba(255,255,255,0.9)', fontSize: { xs: 16, md: 19 }, fontWeight: 600 }}>{note.title}</Typography>
            </Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.66)', fontSize: 12, fontFamily: 'var(--wc-font-data)', whiteSpace: 'nowrap' }}>{note.date}</Typography>
          </Stack>
          <Typography sx={{ position: 'relative', mt: 2.4, maxWidth: 760, color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.75 }}>{note.summary}</Typography>
        </Box>

        <Stack spacing={{ xs: 4.5, md: 5.5 }} sx={{ p: { xs: 2.5, md: 4 } }}>
          <Box>
            <SectionHeading number="1" title="Company Overview" />
            <Stack spacing={1.5} sx={{ mt: 2.2 }}>{note.overview.map((paragraph) => <Typography key={paragraph} sx={{ color: 'var(--wc-text-secondary)', fontSize: 14.5, lineHeight: 1.8 }}>{paragraph}</Typography>)}</Stack>
          </Box>

          <Box>
            <SectionHeading number="2" title="Operational Growth Since IPO" />
            <Stack spacing={1.5} sx={{ mt: 2.2, mb: 2.5 }}>{note.investmentThesis.slice(0, 1).map((paragraph) => <Typography key={paragraph} sx={{ color: 'var(--wc-text-secondary)', fontSize: 14.5, lineHeight: 1.8 }}>{paragraph}</Typography>)}</Stack>
            <DataTable headers={['Metric', 'Value', 'Context']}>
              {note.operatingMetrics.map((row) => <TableRow key={row.label} sx={{ '&:last-child td': { borderBottom: 0 } }}><TableCell sx={{ color: 'var(--wc-text-primary)', fontSize: 13, fontWeight: 700, borderColor: 'var(--wc-divider-soft)' }}>{row.label}</TableCell><TableCell sx={{ color: 'var(--wc-text-primary)', fontFamily: 'var(--wc-font-data)', fontSize: 13, fontWeight: 800, borderColor: 'var(--wc-divider-soft)' }}>{row.value}</TableCell><TableCell sx={{ color: 'var(--wc-text-secondary)', fontSize: 13, borderColor: 'var(--wc-divider-soft)' }}>{row.context}</TableCell></TableRow>)}
            </DataTable>
          </Box>

          <Box>
            <SectionHeading number="3" title="The Investment Income Thesis" description="Why the Q3 loss was temporary." />
            <Stack spacing={1.5} sx={{ mt: 2.2, mb: 2.5 }}>{note.investmentThesis.slice(1).map((paragraph) => <Typography key={paragraph} sx={{ color: 'var(--wc-text-secondary)', fontSize: 14.5, lineHeight: 1.8 }}>{paragraph}</Typography>)}</Stack>
            <DataTable headers={['Period', 'Other Income', 'Driver / Context']}>
              {note.investmentIncome.map((row) => <TableRow key={row.label} sx={{ '&:last-child td': { borderBottom: 0 } }}><TableCell sx={{ color: 'var(--wc-text-primary)', fontSize: 13, fontWeight: 700, borderColor: 'var(--wc-divider-soft)' }}>{row.label}</TableCell><TableCell sx={{ color: row.value.startsWith('(') ? 'var(--wc-error)' : 'var(--wc-success)', fontFamily: 'var(--wc-font-data)', fontSize: 13, fontWeight: 800, borderColor: 'var(--wc-divider-soft)' }}>{row.value}</TableCell><TableCell sx={{ color: 'var(--wc-text-secondary)', fontSize: 13, borderColor: 'var(--wc-divider-soft)' }}>{row.context}</TableCell></TableRow>)}
            </DataTable>
          </Box>

          <Box>
            <SectionHeading number="4" title="FY2026 Earnings Model" description="Operating PAT annualised: Rs. 445 mn | Shares: 262.5 mn | Tax: Nil (Exempt)" />
            <Box sx={{ mt: 2.5 }}>
              <DataTable headers={['Item', 'Operating Base (Zero Other Income)', 'Scenario A: Other Income Rs. 750 mn', 'Scenario B: Other Income Rs. 900 mn']}>
                {note.earningsScenarios.map((row) => <TableRow key={row.item} sx={{ '&:last-child td': { borderBottom: 0 }, ...(row.item === 'Full-Year PAT' || row.item === 'EPS (Rs.)' ? { bgcolor: 'rgba(238,245,255,0.55)' } : {}) }}><TableCell sx={{ color: 'var(--wc-text-primary)', fontSize: 13, fontWeight: 700, borderColor: 'var(--wc-divider-soft)' }}>{row.item}</TableCell><TableCell sx={{ color: 'var(--wc-text-primary)', fontFamily: 'var(--wc-font-data)', fontSize: 13, fontWeight: 700, borderColor: 'var(--wc-divider-soft)' }}>{row.operatingBase}</TableCell><TableCell sx={{ color: 'var(--wc-primary)', fontFamily: 'var(--wc-font-data)', fontSize: 13, fontWeight: 800, borderColor: 'var(--wc-divider-soft)' }}>{row.scenarioA}</TableCell><TableCell sx={{ color: 'var(--wc-success)', fontFamily: 'var(--wc-font-data)', fontSize: 13, fontWeight: 800, borderColor: 'var(--wc-divider-soft)' }}>{row.scenarioB}</TableCell></TableRow>)}
              </DataTable>
            </Box>
          </Box>

          <Box>
            <SectionHeading number="5" title="Valuation Matrix" description="Current price: Rs. 39" />
            <Box sx={{ mt: 2.5 }}>
              <DataTable headers={['Scenario', 'EPS (Rs.)', 'P/E @ Rs. 39', 'FV @ 12×', 'FV @ 14×']}>
                {note.valuations.map((row) => <TableRow key={row.scenario} sx={{ '&:last-child td': { borderBottom: 0 } }}><TableCell sx={{ color: 'var(--wc-text-primary)', fontSize: 13, fontWeight: 700, borderColor: 'var(--wc-divider-soft)' }}>{row.scenario}</TableCell><TableCell sx={{ color: 'var(--wc-text-primary)', fontFamily: 'var(--wc-font-data)', fontSize: 13, fontWeight: 700, borderColor: 'var(--wc-divider-soft)' }}>{row.eps}</TableCell><TableCell sx={{ color: 'var(--wc-primary)', fontFamily: 'var(--wc-font-data)', fontSize: 13, fontWeight: 800, borderColor: 'var(--wc-divider-soft)' }}>{row.pe}</TableCell><TableCell sx={{ color: 'var(--wc-text-primary)', fontFamily: 'var(--wc-font-data)', fontSize: 13, fontWeight: 700, borderColor: 'var(--wc-divider-soft)' }}>{row.fairValue12x}</TableCell><TableCell sx={{ color: 'var(--wc-success)', fontFamily: 'var(--wc-font-data)', fontSize: 13, fontWeight: 800, borderColor: 'var(--wc-divider-soft)' }}>{row.fairValue14x}</TableCell></TableRow>)}
              </DataTable>
            </Box>
          </Box>

          <Box>
            <SectionHeading number="6" title="Key Variable to Watch in Annual Results" />
            <Stack spacing={1.35} sx={{ mt: 2.2 }}>{note.watchItems.map((item) => <Stack key={item} direction="row" spacing={1.3} sx={{ alignItems: 'flex-start' }}><Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'var(--wc-primary)', mt: '8px', flexShrink: 0 }} /><Typography sx={{ color: 'var(--wc-text-secondary)', fontSize: 14, lineHeight: 1.75 }}>{item}</Typography></Stack>)}</Stack>
          </Box>

          <Box sx={{ p: { xs: 2, md: 2.5 }, borderLeft: '3px solid var(--wc-primary)', bgcolor: 'var(--wc-primary-light)' }}>
            <Typography sx={{ color: 'var(--wc-primary)', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Disclaimer</Typography>
            <Typography sx={{ mt: 1, color: 'var(--wc-text-secondary)', fontSize: 12.5, lineHeight: 1.75 }}>{note.disclaimer}</Typography>
          </Box>
        </Stack>
      </Box>
    </Stack>
  )
}

export function ResearchPage() {
  const [featuredNote] = researchNotes

  return (
    <Box component="main" sx={{ pt: { xs: 'var(--wc-page-top-xs)', md: 'var(--wc-page-top-md)' }, pb: { xs: 'var(--wc-page-bottom-xs)', md: 'var(--wc-page-bottom-md)' }, bgcolor: 'var(--wc-bg)' }}>
      <Container maxWidth="xl" sx={{ maxWidth: '1400px !important', px: { xs: 'var(--wc-page-gutter-xs)', md: 'var(--wc-page-gutter-md)', xl: 'var(--wc-page-gutter-xl)' } }}>
        <Stack spacing={{ xs: 5, md: 6 }}>
          <MotionReveal>
            <Box sx={{ maxWidth: 790 }}>
              <Typography sx={{ color: 'var(--wc-primary)', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Research</Typography>
              <Typography variant="h1" sx={{ mt: 1.5, color: 'var(--wc-text-primary)', fontSize: { xs: '2.45rem', md: '4rem' }, lineHeight: 0.97 }}>Independent thinking, <Box component="span" sx={{ color: 'var(--wc-primary)' }}>made useful.</Box></Typography>
              <Typography sx={{ mt: 2.4, color: 'var(--wc-text-secondary)', fontSize: { xs: 15, md: 16 }, lineHeight: 1.8, maxWidth: 690 }}>Our research notes connect operating performance, market context, and valuation scenarios to help investors form their own informed view.</Typography>
            </Box>
          </MotionReveal>

          <MotionReveal delay={0.08}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '300px minmax(0, 1fr)' }, border: '1px solid var(--wc-divider)', borderRadius: '10px', overflow: 'hidden', bgcolor: '#fff', boxShadow: 'var(--wc-shadow-card)' }}>
              <Box sx={{ p: { xs: 2.5, md: 3 }, bgcolor: 'var(--wc-primary-light)', borderBottom: { xs: '1px solid var(--wc-divider)', lg: 'none' }, borderRight: { lg: '1px solid var(--wc-divider)' } }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><DescriptionOutlinedIcon sx={{ color: 'var(--wc-primary)', fontSize: 19 }} /><Typography sx={{ color: 'var(--wc-primary)', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Research Library</Typography></Stack>
                <Typography sx={{ mt: 2, color: 'var(--wc-text-secondary)', fontSize: 13, lineHeight: 1.7 }}>New notes will appear here as they are published.</Typography>
                <Divider sx={{ my: 2.2, borderColor: 'var(--wc-divider)' }} />
                <Stack spacing={0.7}>{researchNotes.map((note) => <Box key={note.id} sx={{ p: 1.4, borderRadius: '5px', bgcolor: '#fff', border: '1px solid var(--wc-primary)', boxShadow: '0 5px 15px rgba(10,46,120,0.05)' }}><Typography sx={{ color: 'var(--wc-primary)', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em' }}>{note.ticker}</Typography><Typography sx={{ mt: 0.35, color: 'var(--wc-text-primary)', fontSize: 13, fontWeight: 800, lineHeight: 1.35 }}>{note.company}</Typography><Typography sx={{ mt: 0.35, color: 'var(--wc-text-muted)', fontSize: 11 }}>{note.date}</Typography></Box>)}</Stack>
              </Box>
              <Box sx={{ p: { xs: 2.5, md: 3.2 } }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
                  <Box><Typography sx={{ color: 'var(--wc-text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Latest note</Typography><Typography variant="h2" sx={{ mt: 0.7, fontSize: { xs: '1.55rem', md: '2rem' }, color: 'var(--wc-text-primary)' }}>{featuredNote.company} — {featuredNote.title}</Typography></Box>
                  <TrendingUpRoundedIcon sx={{ color: 'var(--wc-primary)', fontSize: 36 }} />
                </Stack>
                <Typography sx={{ mt: 1.7, color: 'var(--wc-text-secondary)', fontSize: 14, lineHeight: 1.75 }}>{featuredNote.summary}</Typography>
                <Stack direction="row" spacing={0.8} sx={{ mt: 2.2, flexWrap: 'wrap', rowGap: 0.8 }}>{featuredNote.tags.map((tag) => <Chip key={tag} label={tag} size="small" sx={{ height: 24, bgcolor: 'var(--wc-bg)', color: 'var(--wc-primary)', border: '1px solid var(--wc-divider)', fontSize: 10.5, fontWeight: 700 }} />)}</Stack>
              </Box>
            </Box>
          </MotionReveal>

          <MotionReveal delay={0.12}><ResearchNoteView note={featuredNote} /></MotionReveal>

          <Box sx={{ textAlign: 'center' }}><Button component={RouterLink} to="/" endIcon={<ArrowForwardIcon />} sx={{ color: 'var(--wc-primary)', fontWeight: 800 }}>Return to home</Button></Box>
        </Stack>
      </Container>
    </Box>
  )
}

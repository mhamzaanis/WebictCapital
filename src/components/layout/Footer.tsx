import { Box, Container, Grid, Link, Stack, Typography } from '@mui/material'
import { motion, useReducedMotion } from 'motion/react'
import { footerColumns } from '../../content/siteContent'

const legalLinks = ['Webict Capital eVentCloud', 'Confidentiality', 'Our Commitment', 'Code of conduct', 'Legal']

export function Footer() {
  const reduceMotion = useReducedMotion()

  return (
    <Box
      component={motion.footer}
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      whileInView={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
      sx={{ bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider', py: { xs: 6, md: 8 } }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 3 } }}>
        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid size={{ xs: 12, md: 3 }} component={motion.div} initial={reduceMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.16 }} transition={{ duration: 0.45 }}>
            <Typography variant="h5" sx={{ fontSize: 20, mb: 2 }}>Webict Capital.</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              Karachi, Pakistan
              {/* <br />
              London WC1X 9JB, UK
              <br />
              +44 (0) 20 7016 6800
              <br />
              +44 (0) 20 7016 6811 */}
            </Typography>
          </Grid>

          {footerColumns.map((column) => (
            <Grid key={column.title} size={{ xs: 12, sm: 6, md: 2.25 }} component={motion.div} initial={reduceMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.16 }} transition={{ duration: 0.45, delay: 0.06 }}>
              <Typography sx={{ fontWeight: 600, mb: 2, fontSize: 14 }}>{column.title}</Typography>
              <Stack spacing={1.2}>
                {column.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    underline="hover"
                    color="text.secondary"
                    sx={{ fontSize: 13, transition: 'color 0.25s ease, transform 0.25s ease', '&:hover': { color: 'primary.main', transform: 'translateX(2px)' } }}
                  >
                    {link.label}
                  </Link>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>

        <Box component={motion.div} initial={reduceMotion ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5, delay: 0.1 }} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 3, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>© Webict Capital. All rights reserved.</Typography>
            {/* <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>
              Webict Capital SAS LLC is authorised and regulated by the Financial Conduct Authority.
            </Typography> */}
          </Box>
          {/* <Stack direction="row" spacing={1.3} useFlexGap sx={{ flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
            {legalLinks.map((item) => (
              <Link
                key={item}
                href="#"
                underline="hover"
                color="text.secondary"
                sx={{ fontSize: 12, transition: 'color 0.25s ease', '&:hover': { color: 'primary.main' } }}
              >
                {item}
              </Link>
            ))}
          </Stack> */}
        </Box>
      </Container>
    </Box>
  )
}

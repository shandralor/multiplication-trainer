import { redirect } from 'next/navigation'

/** The kluis moved inside Tafels, where it always belonged. */
export default function SafeRedirect() {
  redirect('/tafels/kluis')
}

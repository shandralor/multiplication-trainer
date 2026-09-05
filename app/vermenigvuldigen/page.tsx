import { redirect } from 'next/navigation'

/** Renamed to /tafels in the world rework; kept so old links still land. */
export default function VermenigvuldigenRedirect() {
  redirect('/tafels')
}

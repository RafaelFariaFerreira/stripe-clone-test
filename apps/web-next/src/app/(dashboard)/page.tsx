import { redirect } from 'next/navigation';

/** The Payments list is the home of this app. */
export default function Home() {
  redirect('/payments');
}

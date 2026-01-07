import type { Metadata } from 'next';
import { ContactForm } from '@/components/contact-form';

export const metadata: Metadata = {
  title: 'Contact'
};

export default function ContactPage() {
  return (
    <div className="container space-y-4">
      <h1 className="text-2xl font-semibold">Contact</h1>
      <p className="text-muted max-w-2xl">
        Send feedback or partnership inquiries. This form posts to a mock API route (no email sending by default).
      </p>
      <ContactForm />
    </div>
  );
}

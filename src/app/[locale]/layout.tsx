import { use } from "react";
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import "@/app/globals.css"

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'zh' }];
}

export default function LocaleLayout(
  props: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
  }
) {
  const params = use(props.params);

  const {
    locale
  } = params;

  const {
    children
  } = props;

  const messages = useMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head />
      <body className="h-screen">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <DashboardLayout>{children}</DashboardLayout>
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

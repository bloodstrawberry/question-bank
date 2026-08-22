import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { StudyManagerView } from 'src/sections/study/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Study - ${CONFIG.appName}` };

export default function Page() {
  return <StudyManagerView />;
}


const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function timeAgo(dateString: string) {
   if (!dateString) return 'invalid date!'

   const date = new Date(dateString);
   const now = new Date();
   const secondsDiff = Math.round((now.getTime() - date.getTime()) / 1000);

   const units: { label: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
      { label: 'second', seconds: 1 }
   ];

   for (const unit of units) {
      if (secondsDiff >= unit.seconds || unit.label === 'second') {
         const count = Math.floor(secondsDiff / unit.seconds);
         return rtf.format(-count, unit.label);
      }
   }
   return 'just now';
}
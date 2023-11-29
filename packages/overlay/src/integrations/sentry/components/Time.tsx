import dayjs from 'dayjs';
import DayJsLocalizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(DayJsLocalizedFormat);

export default function Time({
  date,
  ...props
}: { date: string | number | Date; format?: string } & React.ComponentProps<'time'>) {
  if (!date) return null;

  return (
    <time dateTime={date instanceof Date ? date.toISOString() : `${date}`} {...props}>
      {dayjs(date).format(props.format ? props.format : 'LTS')}
    </time>
  );
}

import dayjs from "dayjs";
import DayJsLocalizedFormat from "dayjs/plugin/localizedFormat";

dayjs.extend(DayJsLocalizedFormat);

export default function DateTime({
  date,
  ...props
}: { date: string | Date } & React.ComponentProps<"time">) {
  if (!date) return null;

  return (
    <time
      dateTime={date instanceof Date ? date.toISOString() : date}
      {...props}
    >
      {dayjs(date).format("LL LTS")}
    </time>
  );
}

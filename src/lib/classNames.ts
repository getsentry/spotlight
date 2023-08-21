export default function classNames(
  ...classes: (string | undefined | boolean | null)[]
) {
  return classes.filter(Boolean).join(" ");
}

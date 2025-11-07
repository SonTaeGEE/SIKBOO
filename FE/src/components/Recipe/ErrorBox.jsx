export default function ErrorBox({ error }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      오류가 발생했습니다. {String(error?.message ?? "")}
    </div>
  );
}

const MyPage = () => {
  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <h2 className="mb-4 text-lg font-bold text-[#333333]">마이페이지</h2>
        <div className="rounded-lg bg-white p-6 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#5f0080] text-2xl font-bold text-white">
            나
          </div>
          <h3 className="mb-1 text-lg font-bold text-[#333333]">나OO</h3>
          <p className="text-sm text-[#999999]">청주시 흥덕구 율량동</p>
        </div>

        <div className="mt-4 divide-y divide-[#f4f4f4] rounded-lg bg-white">
          <button className="w-full px-6 py-4 text-left text-[#333333] transition">
            참여 내역
          </button>
          <button className="w-full px-6 py-4 text-left text-[#333333] transition">
            내가 만든 공동구매
          </button>
          <button className="w-full px-6 py-4 text-left text-[#333333] transition">설정</button>
        </div>
      </div>
    </div>
  );
};

export default MyPage;

import { MapPin } from 'lucide-react';
import { CATEGORY } from '@/constants/category';

const GroupBuyingForm = ({
  formData,
  selectedCategory,
  selectedLocation,
  onInputChange,
  onFormattedInputChange,
  onCategoryChange,
  onLocationModalOpen,
  onSubmit,
  onCancel,
  isSubmitting,
  submitButtonText = '공동구매 만들기',
  showCurrentPeople = false,
  currentPeople = 0,
}) => {
  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">식재료명</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={onInputChange}
          placeholder="예: 제주 한라봉 5kg"
          className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#5f0080] focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">카테고리</label>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORY.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategoryChange(category.id)}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition ${
                  isSelected
                    ? 'border-[#5f0080] bg-purple-50'
                    : 'border-gray-200 hover:border-[#5f0080] hover:bg-purple-50'
                }`}
              >
                <Icon size={24} className={category.color} />
                <span className="text-sm font-medium">{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">총 금액</label>
          <input
            type="text"
            name="totalPrice"
            value={formData.totalPrice}
            onChange={onFormattedInputChange}
            inputMode="numeric"
            placeholder="50,000"
            className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#5f0080] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">최대 인원</label>
          <input
            type="text"
            name="maxParticipants"
            value={formData.maxParticipants}
            onChange={onFormattedInputChange}
            inputMode="numeric"
            placeholder="5"
            className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#5f0080] focus:outline-none"
          />
          {showCurrentPeople && (
            <p className="mt-1 text-xs text-gray-500">현재 참여 인원: {currentPeople}명</p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          수령 장소
          <span className="ml-1 text-xs font-normal text-gray-500">
            (현재 위치 기준 3km 이내)
          </span>
        </label>
        <button
          type="button"
          onClick={onLocationModalOpen}
          className={`flex w-full items-center gap-2 rounded-lg border ${
            selectedLocation ? 'border-[#5f0080] bg-purple-50' : 'border-gray-200'
          } px-4 py-3 text-left transition hover:border-[#5f0080] hover:bg-purple-50`}
        >
          <MapPin size={20} className={selectedLocation ? 'text-[#5f0080]' : 'text-gray-400'} />
          <div className="flex-1">
            {selectedLocation ? (
              <div>
                <p className="font-medium text-gray-800">{selectedLocation.address}</p>
              </div>
            ) : (
              <p className="text-gray-500">지도에서 수령 장소를 선택해주세요</p>
            )}
          </div>
        </button>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">마감 시간</label>
        <input
          type="datetime-local"
          name="deadline"
          value={formData.deadline}
          onChange={onInputChange}
          className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#5f0080] focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">
          마감 시간 이후에는 새로운 참여가 불가능합니다
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">상세 설명 (선택)</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={onInputChange}
          rows={4}
          placeholder="예: 제주 직송 한라봉입니다. 신선도 보장합니다!"
          className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#5f0080] focus:outline-none"
        />
      </div>

      {onCancel ? (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border-2 border-gray-300 py-4 text-lg font-bold text-gray-600 transition hover:border-gray-400"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-[#5f0080] py-4 text-lg font-bold text-white transition hover:bg-[#4a0066] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? '처리 중...' : submitButtonText}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full rounded-xl bg-[#5f0080] py-4 text-lg font-bold text-white transition hover:bg-[#4a0066] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? '생성 중...' : submitButtonText}
        </button>
      )}
    </div>
  );
};

export default GroupBuyingForm;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Clock, Plus, Search, ShoppingBag } from 'lucide-react';
import { ingredients as initialItems, categories } from '../../data/ingredients';

const GroupBuying = () => {
  const navigate = useNavigate();
  const [location] = useState('청주시 흥덕구 율량동');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('recruiting'); // 'recruiting' or 'joined'

  // TODO: 실제로는 서버에서 가져와야 함
  const myJoinedItemIds = [1, 3]; // 예시: 내가 참여한 공동구매 ID들

  const filteredItems = initialItems.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = category === 'all' || item.category === category;
    const matchesTab =
      activeTab === 'recruiting' ? item.status === 'recruiting' : myJoinedItemIds.includes(item.id);
    return matchesSearch && matchesCategory && matchesTab;
  });

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-6xl px-4 py-4">
        {/* Location */}
        <div className="mb-4 flex items-center justify-end gap-1 text-sm text-[#666666]">
          <MapPin size={14} className="text-[#5f0080]" />
          <span>{location}</span>
        </div>

        {/* Search Bar - Kurly Style */}
        <div className="mb-4">
          <div className="relative">
            <Search
              className="absolute top-1/2 left-4 -translate-y-1/2 transform text-[#999999]"
              size={18}
            />
            <input
              type="text"
              placeholder="검색어를 입력해주세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#e0e0e0] bg-white py-3 pr-4 pl-11 text-[#333333] placeholder-[#999999] focus:border-[#5f0080] focus:outline-none"
            />
          </div>
        </div>

        {/* Banner - Kurly Style */}
        <div className="mb-4 rounded-lg bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="mb-1 text-lg font-bold text-[#333333]">
                지금 우리 동네에서
                <br />
                <span className="text-[#5f0080]">신선한 식재료</span>를 함께 구매하세요
              </h2>
              <p className="text-xs text-[#666666]">함께 사면 더 저렴하게, 더 신선하게</p>
            </div>
          </div>
        </div>

        {/* Main Tabs - 모집중 / 내 공동구매 */}
        <div className="mb-4 flex gap-2 rounded-lg bg-white p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('recruiting')}
            className={`flex-1 rounded-md py-2.5 text-sm font-medium transition ${
              activeTab === 'recruiting'
                ? 'bg-[#5f0080] text-white'
                : 'text-[#666666] hover:bg-gray-50'
            }`}
          >
            모집중인 공동구매
          </button>
          <button
            onClick={() => setActiveTab('joined')}
            className={`flex-1 rounded-md py-2.5 text-sm font-medium transition ${
              activeTab === 'joined' ? 'bg-[#5f0080] text-white' : 'text-[#666666] hover:bg-gray-50'
            }`}
          >
            내 공동구매
          </button>
        </div>

        {/* Category Tabs - Kurly Style */}
        <div className="-mx-4 mb-4 px-4">
          <div className="scrollbar-hide flex gap-2 overflow-x-auto border-b border-[#e0e0e0] pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 font-medium whitespace-nowrap transition ${
                  category === cat.id
                    ? 'border-[#5f0080] text-[#5f0080]'
                    : 'border-transparent text-[#666666]'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span className="text-sm">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid - Kurly Style */}
        <div className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#333333]">
              {activeTab === 'recruiting' ? '모집중인 공동구매' : '내 공동구매'}{' '}
              <span className="text-[#5f0080]">{filteredItems.length}</span>
            </h3>
          </div>

          {filteredItems.length === 0 ? (
            <div className="rounded-lg bg-gray-50 py-16 text-center">
              <p className="text-sm text-gray-500">
                {activeTab === 'recruiting'
                  ? '모집중인 공동구매가 없습니다.'
                  : '참여한 공동구매가 없습니다.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/group-buying/detail/${item.id}`)}
                  className="cursor-pointer overflow-hidden rounded-lg border border-[#e0e0e0] bg-white transition hover:shadow-lg"
                >
                  {/* Product Info */}
                  <div className="p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <h4 className="line-clamp-1 flex-1 text-sm font-medium text-[#333333]">
                        {item.title}
                      </h4>
                      {item.status === 'recruiting' ? (
                        <div className="ml-2 rounded-full bg-[#5f0080] px-2 py-0.5 text-xs font-medium whitespace-nowrap text-white">
                          모집중
                        </div>
                      ) : (
                        <div className="ml-2 rounded-full bg-[#999999] px-2 py-0.5 text-xs font-medium whitespace-nowrap text-white">
                          마감
                        </div>
                      )}
                    </div>

                    <div className="mb-2 flex items-center gap-2 text-xs text-[#999999]">
                      <MapPin size={11} />
                      <span>{item.location}</span>
                      <span>·</span>
                      <span>{item.distance}km</span>
                    </div>

                    <div className="mb-2 flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1 text-[#666666]">
                        <Users size={13} className="text-[#5f0080]" />
                        <span>
                          {item.currentPeople}/{item.maxPeople}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[#666666]">
                        <Clock size={13} className="text-[#ff6b6b]" />
                        <span>{item.deadline}</span>
                      </div>
                    </div>

                    <div className="border-t border-[#f4f4f4] pt-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="mb-0.5 text-xs text-[#999999] line-through">
                            {item.price.toLocaleString()}원
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-[#333333]">
                              {item.pricePerPerson.toLocaleString()}
                            </span>
                            <span className="text-xs text-[#666666]">원</span>
                          </div>
                        </div>
                        <ShoppingBag size={18} className="text-[#5f0080]" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating Button */}
        <button
          onClick={() => navigate('/group-buying/create')}
          className="fixed right-4 bottom-20 rounded-full bg-[#5f0080] p-4 text-white shadow-xl transition-all hover:scale-110 hover:bg-[#4a0066]"
        >
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
};

export default GroupBuying;

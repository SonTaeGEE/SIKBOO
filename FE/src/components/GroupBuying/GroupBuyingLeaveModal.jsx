import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const GroupBuyingLeaveModal = ({ showLeaveDialog, setShowLeaveDialog, handleLeave, isPending }) => {
  return (
    <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
      <DialogContent className="bg-white p-8">
        <DialogHeader>
          <DialogTitle>공동구매 나가기</DialogTitle>
          <DialogDescription>정말로 이 공동구매에서 나가시겠습니까?</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            onClick={() => setShowLeaveDialog(false)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleLeave}
            disabled={isPending}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? '나가는 중...' : '나가기'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GroupBuyingLeaveModal;

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const OnboardingSkipModal = ({ showSkipDialog, setShowSkipDialog, handleSkip, isPending }) => {
  return (
    <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
      <DialogContent className="bg-white p-8">
        <DialogHeader>
          <DialogTitle>설문 건너뛰기</DialogTitle>
          <DialogDescription>
            설문을 건너뛰시겠습니까?
            <br />
            나중에 마이페이지에서 수정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            onClick={() => setShowSkipDialog(false)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleSkip}
            disabled={isPending}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? '건너뛰는 중...' : '건너뛰기'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingSkipModal;

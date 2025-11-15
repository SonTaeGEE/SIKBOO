import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const RecipeDeleteModal = ({ showDeleteDialog, setShowDeleteDialog, handleDelete, isPending }) => {
  return (
    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <DialogContent className="bg-white p-8">
        <DialogHeader>
          <DialogTitle>레시피 삭제</DialogTitle>
          <DialogDescription>
            정말로 이 레시피를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            onClick={() => setShowDeleteDialog(false)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? '삭제 중...' : '삭제'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecipeDeleteModal;

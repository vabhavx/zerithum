import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPercent } from "@/lib/taxUtils";

export function AssumptionsDrawer({ open, onOpenChange, assumptions }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-[560px] border-l border-white/10 bg-[#0F0F12]/95 p-0 text-[#F5F5F5] backdrop-blur-xl"
        style={{
          left: "auto",
          top: "0",
          right: "0",
          transform: "none",
          height: "100vh",
          maxWidth: "560px",
        }}
      >
        <div className="h-full overflow-y-auto p-6">
          <DialogHeader className="mb-6 space-y-2 text-left">
            <DialogTitle className="text-xl font-semibold text-[#F5F5F5]">
              Tax Estimator Assumptions
            </DialogTitle>
            <DialogDescription className="text-sm text-white/70">
              This model is conservative and transparent. It is not a tax filing engine.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm text-white/85">
            <div className="rounded-lg border border-white/10 bg-[#141418] p-4">
              <p className="mb-2 font-medium text-[#F5F5F5]">Federal tax method</p>
              <p>
                Progressive federal tax brackets are applied to estimated taxable income by filing status.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#141418] p-4">
              <p className="mb-2 font-medium text-[#F5F5F5]">Self-employment tax</p>
              <p>
                Self-employment tax is estimated at {formatPercent(0.153)}, then half of that amount is deducted before federal/state estimation.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#141418] p-4">
              <p className="mb-2 font-medium text-[#F5F5F5]">State estimate</p>
              <p>
                State taxes use effective-rate assumptions by selected state. For {assumptions.stateLabel}, the rate applied is{" "}
                {formatPercent(assumptions.stateRate)}.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

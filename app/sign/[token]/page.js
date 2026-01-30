"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";
import SignatureCanvas from "react-signature-canvas";
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";

export default function PublicSignPage() {
  const { token } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const sigPad = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contract, setContract] = useState(null);
  const [shareRecord, setShareRecord] = useState(null);
  const [hasSigned, setHasSigned] = useState(false);
  const [signing, setSigning] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadContract();
  }, [token]);

  const loadContract = async () => {
    try {
      const { data: share, error: shareError } = await supabase
        .from("contract_shares")
        .select(
          `
          *,
          contracts (*)
        `
        )
        .eq("share_token", token)
        .single();

      if (shareError || !share) {
        throw new Error("Invalid or expired link");
      }

      if (!share.is_active) {
        throw new Error("This link has been deactivated");
      }

      if (new Date(share.expires_at) < new Date()) {
        throw new Error("This link has expired");
      }

      if (share.signed_at) {
        throw new Error("This contract has already been signed");
      }

      setShareRecord(share);
      setContract(share.contracts);

      if (!share.viewed_at) {
        await supabase
          .from("contract_shares")
          .update({ viewed_at: new Date().toISOString() })
          .eq("id", share.id);
      }
    } catch (err) {
      console.error("Load error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureEnd = () => {
    if (sigPad.current && !sigPad.current.isEmpty()) {
      setHasSigned(true);
    }
  };

  const clearSignature = () => {
    if (sigPad.current) {
      sigPad.current.clear();
      setHasSigned(false);
    }
  };

  const handleSubmitSignature = async () => {
    if (!sigPad.current || sigPad.current.isEmpty()) {
      alert("Please sign before submitting");
      return;
    }

    setSigning(true);

    try {
      const signatureData = sigPad.current.toDataURL("image/png");

      const { error: contractError } = await supabase
        .from("contracts")
        .update({
          signature_data: signatureData,
          signed_at: new Date().toISOString(),
        })
        .eq("id", contract.id);

      if (contractError) throw contractError;

      // Create notification for contractor
      try {
        const { data: contractData } = await supabase
          .from("contracts")
          .select("user_id, job_name, client_name, job_id")
          .eq("id", contract.id)
          .single();

        if (contractData) {
          await supabase.from("notifications").insert({
            user_id: contractData.user_id,
            type: "contract_signed",
            title: "Contract Signed",
            message: `${contractData.client_name} signed the contract for ${contractData.job_name}`,
            contract_id: contract.id,
            job_id: contractData.job_id,
            is_read: false,
          });
          console.log("✓ Notification created");
        }
      } catch (notifError) {
        console.error("Notification error:", notifError);
        // Don't fail the signing process if notification fails
      }

      const { error: shareError } = await supabase
        .from("contract_shares")
        .update({
          signed_at: new Date().toISOString(),
          is_active: false,
        })
        .eq("id", shareRecord.id);

      if (shareError) throw shareError;

      setSuccess(true);
    } catch (err) {
      console.error("Sign error:", err);
      alert("Failed to save signature. Please try again.");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-[#FF6700] mx-auto mb-4" />
          <p className="text-gray-600">Loading contract...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <XCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">Please contact the contractor for a new link.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Contract Signed!</h1>
          <p className="text-gray-600 mb-6">
            Your signature has been saved. The contractor will receive a notification.
          </p>
          <p className="text-sm text-gray-500">You can safely close this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#FF6700] flex items-center justify-center">
              <span className="text-white font-bold text-xl">FDO</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#FF6700]">FieldDeskOps</p>
              <h1 className="text-xl font-bold text-gray-900">Contract Signature</h1>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>{contract.contractor_name}</strong> has sent you a contract to review and sign.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{contract.job_name}</h2>
            <p className="text-sm text-gray-500">
              Customer: <span className="font-semibold text-gray-700">{contract.client_name}</span>
            </p>
            <p className="text-sm text-gray-500">
              Date:{" "}
              <span className="font-semibold text-gray-700">
                {new Date(contract.created_at).toLocaleDateString()}
              </span>
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
            {contract.contract_body}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Your Signature</h3>

          <div className="border-2 border-gray-300 rounded-lg bg-white mb-4">
            <SignatureCanvas
              ref={sigPad}
              onEnd={handleSignatureEnd}
              canvasProps={{
                className: "w-full h-48 touch-none",
                style: { touchAction: "none" },
              }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={clearSignature}
              disabled={signing}
              className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Clear
            </button>
            <button
              onClick={handleSubmitSignature}
              disabled={!hasSigned || signing}
              className="flex-1 px-6 py-3 rounded-xl bg-[#FF6700] text-white font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {signing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Sign & Submit"
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            By signing, you agree to the terms outlined in this contract.
          </p>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          Powered by <span className="text-[#FF6700] font-bold">FieldDeskOps</span>
        </p>
      </div>
    </div>
  );
}

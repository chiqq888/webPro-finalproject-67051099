import { useState } from "react";
import { REPORT_REASONS } from "../data/constants.js";

export default function ReportForm({ onSubmit, onCancel, submitting, error }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [errors, setErrors] = useState({});

  function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const cleanDetails = details.trim();
    const nextErrors = {};

    if (!Object.hasOwn(REPORT_REASONS, reason)) {
      nextErrors.reason = "กรุณาเลือกเหตุผลที่รายงาน";
    }
    if (cleanDetails.length > 500) {
      nextErrors.details = "รายละเอียดต้องยาวไม่เกิน 500 ตัวอักษร";
    } else if (reason === "other" && cleanDetails.length < 10) {
      nextErrors.details = "กรุณาระบุรายละเอียดอย่างน้อย 10 ตัวอักษร";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit({ reason, details: cleanDetails });
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label htmlFor="report-reason" className="mb-1.5 block text-sm font-semibold">
          เหตุผล
        </label>
        <select
          id="report-reason"
          className="field-control w-full"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          aria-invalid={Boolean(errors.reason)}
          aria-describedby={errors.reason ? "report-reason-error" : undefined}
          disabled={submitting}
          required
        >
          <option value="">เลือกเหตุผล</option>
          {Object.entries(REPORT_REASONS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {errors.reason && (
          <p id="report-reason-error" className="mt-1.5 text-sm text-red-700" role="alert">
            {errors.reason}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="report-details" className="mb-1.5 block text-sm font-semibold">
          รายละเอียด {reason !== "other" && <span className="font-normal text-slate-600">(ถ้ามี)</span>}
        </label>
        <textarea
          id="report-details"
          className="field-control w-full resize-y"
          rows={4}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          aria-invalid={Boolean(errors.details)}
          aria-describedby={errors.details ? "report-details-error" : "report-details-limit"}
          disabled={submitting}
          required={reason === "other"}
        />
        <p id="report-details-limit" className="mt-1 text-sm text-slate-600">
          {reason === "other" ? "ระบุ 10–500 ตัวอักษร" : "สูงสุด 500 ตัวอักษร"}
        </p>
        {errors.details && (
          <p id="report-details-error" className="mt-1.5 text-sm text-red-700" role="alert">
            {errors.details}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "กำลังส่งรายงาน…" : "ส่งรายงาน"}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
          ยกเลิก
        </button>
      </div>
    </form>
  );
}

// src/utils/emailSender.js

import { Resend } from "resend";

// 🚨 환경 변수에서 API 키를 가져와 사용합니다.
const resend = new Resend(process.env.RESEND_API_KEY);

// ⚠️ [핵심 수정] Resend 테스트 모드 제한을 만족시키기 위해
// 수신자를 당신의 Resend 계정 이메일로 고정합니다.
// 실제 운영 환경에서는 ADMIN_EMAIL을 환경 변수에서 가져와야 합니다.
const ADMIN_EMAILS = [
  "dkanrjsk3aud@gmail.com",
  "jksoa23@gmail.com", // 추가 관리자 1
  "eyuuu08@gmail.com", // 추가 관리자 2
];
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
// (이 'onboarding@resend.dev'는 Resend가 테스트용으로 허용하는 from 주소입니다.)

/**
 * 예약 완료 알림 이메일을 Resend를 통해 관리자에게 발송합니다.
 * @param {object} data 이메일 내용에 필요한 데이터
 */
export const sendReservationConfirmationEmail = async (data) => {
  const { username, pharmacyname, reservationdate, reservationtime, memo } =
    data;

  // ... (HTML 내용 생성 로직은 동일) ...
  const htmlContent = `
    <h1>이메일 받았나요~~~~?????????</h1>
    <h2>🔔 [예약 알림] ${pharmacyname}에 새로운 예약이 접수되었습니다.</h2>
    <p>아래 예약 정보를 확인하고 준비해 주세요.</p>
    
    <table style="border-collapse: collapse; width: 100%; max-width: 450px; margin-top: 20px; border: 1px solid #ddd;">
      <tr style="background-color: #f2f2f2;">
        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">항목</th>
        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">내용</th>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;"><strong>약국 이름</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd;">${pharmacyname}</td>
      </tr> 
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;"><strong>예약 고객</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd;">${username}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;"><strong>예약 일시</strong></td>
        <td style="padding: 10px; border: 1px solid #ddd;">${reservationdate} ${reservationtime}</td>
      </tr>
      ${
        memo
          ? `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>고객 요청 메모</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${memo}</td>
        </tr>
      `
          : ""
      }
    </table>

    <p style="margin-top: 20px; color: #888;">이 메일은 자동 발송된 알림 메일이며, 회신할 수 없습니다.</p>
  `;

  try {
    const { data: resendData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAILS, // ✅ 당신의 개인 이메일로 발송됩니다.
      subject: `🔔 [새 예약 접수] ${pharmacyname}: ${reservationdate} ${reservationtime}`,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend Error (Admin Mail):", error);
      return { success: false, error: error.message };
    }

    console.log(`Resend Success (Admin Mail to ${ADMIN_EMAILS})`);
    return {
      success: true,
      message: "Admin email sent successfully",
      id: resendData.id,
    };
  } catch (error) {
    console.error("API or Network Error:", error);
    return { success: false, error: "Failed to send admin email" };
  }
};

import debug from "debug";
import {
  fetchSlotsInRange,
  fetchAvailableDates,
  reservationService,
  fetchCancelBooks,
  fetchDelCancelList,
  fetchBooks,
  fetchcancelList,
  sendEmailService,
} from "./reservation.service.js";

const log = debug("app:reservation");

const getSlotsByPharmacy = async (req, res) => {
  const { p_id } = req.params;
  const { from, to } = req.query;

  console.log(
    `[API] getSlotsByPharmacy - p_id: ${p_id}, from: ${from}, to: ${to}`
  );

  if (!from || !to) {
    console.error(
      "[ERROR] Missing required parameters - from or to is missing"
    );
    return res.status(400).json({
      success: false,
      error: "from, to 값이 필요합니다.",
      received: { p_id, from, to },
    });
  }

  try {
    console.log(
      `[API] Fetching slots for pharmacy ${p_id} from ${from} to ${to}`
    );
    const data = await fetchSlotsInRange(p_id, from, to);
    console.log(`[API] Found ${data.length} days of slot data`);
    res.json(data);
  } catch (error) {
    console.error("[ERROR] getSlotsByPharmacy failed:", {
      error: error.message,
      stack: error.stack,
      params: { p_id, from, to },
    });
    res.status(500).json({
      success: false,
      error: "서버 오류가 발생했습니다.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getAvailableDates = async (req, res) => {
  const { p_id } = req.params;
  try {
    const data = await fetchAvailableDates(p_id);
    res.json(data); // 프론트에서는 data 배열만 받도록
    // log("slots", data);
  } catch (error) {
    log("Error in getAvailableDates:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const createReservation = async (req, res) => {
  const { user_id, p_id, date, time, memo } = req.body;
  try {
    const result = await reservationService.createReservation(
      user_id,
      p_id,
      date,
      time,
      memo
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    log("Error in createReservation:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
const getBook = async (req, res) => {
  const { user_id } = req.params;
  console.log("userid in con >>>>", user_id);
  try {
    const data = await fetchBooks(user_id);
    res.json(data);
    // log("books", data);
  } catch (error) {
    log("Error in getBooks:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const cancelBook = async (req, res) => {
  const { user_id, book_id } = req.body;
  console.log("userid in con >>>>", user_id);
  console.log("bookid in con >>>>", book_id);
  try {
    const data = await fetchCancelBooks(user_id, book_id);
    res.json({
      success: true,
      message: "예약이 취소되었습니다.",
      data,
    });
  } catch (error) {
    log("Error in cancelBook:", error);
    res.status(200).json({
      success: false,
      message: error.message || "예약 취소 중 오류가 발생했습니다.",
    });
  }
};

const getcancelList = async (req, res) => {
  const { user_id } = req.params;
  try {
    const data = await fetchcancelList(user_id);
    res.json({
      success: true,
      data: Array.isArray(data) ? data : [],
      count: Array.isArray(data) ? data.length : 0,
    });
    // log("cancellation list", data);
  } catch (error) {
    log("Error in getcancelList:", error);
    res.status(200).json({
      success: true,
      data: [],
      count: 0,
    });
  }
};

const sendEmailController = async (req, res) => {
  // 프론트엔드에서 요청한 필드명과 일치시켜야 합니다.
  console.log("in controller req.body", req.body);
  const { username, pharmacyname, reservationdate, reservationtime, memo } =
    req.body;

  if (!username || !pharmacyname || !reservationdate || !reservationtime) {
    return res
      .status(400)
      .json({ success: false, error: "필수 이메일 정보가 누락되었습니다." });
  }

  try {
    console.log("in controller usename", username);
    console.log("in controller pharmacyname", pharmacyname);
    console.log("in controller reservationdate", reservationdate);
    console.log("in controller reservationtime", reservationtime);
    console.log("in controller memo", memo);
    // user_id, p_id 대신 메일 발송에 필요한 데이터(이메일, 약국 이름 등)를 서비스에 전달
    const result = await sendEmailService(
      username,
      pharmacyname,
      reservationdate,
      reservationtime,
      memo
    );
    // 예약 자체는 이미 성공했으므로, 메일 요청 수락으로 200/201 응답을 보냅니다.
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    // 메일 발송 실패 시 500 응답을 보냅니다.
    log("Error in sendEmailController:", error);
    res
      .status(500)
      .json({ success: false, error: error.message || "Failed to send email" });
  }
};
//취소내역 삭제
const cancelBookById = async (req, res) => {
  const { book_id } = req.params;
  console.log("in controller book_id", book_id);

  try {
    const data = await fetchDelCancelList(book_id);
    res.json({
      success: true,
      message: "취소내역을 삭제했습니다.",
      data,
    });
  } catch (error) {
    log("Error in cancelBookById:", error);
    res.status(200).json({
      success: false,
      message: error.message || "취소내역 삭제 중 오류가 발생했습니다.",
    });
  }
};

export {
  getSlotsByPharmacy,
  getAvailableDates,
  cancelBookById,
  createReservation,
  getBook,
  cancelBook,
  getcancelList,
  sendEmailController,
};

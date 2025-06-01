// 파일 경로: src/app/privacy/page.tsx
'use client'

import React from 'react'

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <h1 className="text-3xl font-bold text-center text-purple-600">
        개인정보 처리방침
      </h1>

      <section className="space-y-4">
        <p className="text-gray-600">
          SafeShare(이하 “회사”)는 이용자의 개인정보를 소중히 다루며, 관련
          법령에 따라 개인정보 처리 방침을 수립·공개합니다. 본 방침은 회사가
          제공하는 암호화 파일 공유 서비스(이하 “서비스”) 이용과정에서 수집되는
          개인정보의 처리 방침을 규정합니다.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700">
          1. 수집하는 개인정보 항목
        </h2>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>
            <strong>회원가입 시 수집항목:</strong> 이메일, 비밀번호(암호화
            저장), 이름, 아바타(선택), 가입일시, 회원ID(자동 생성) 등
          </li>
          <li>
            <strong>프로필 수정 시 수집항목:</strong> 닉네임, 아바타 이미지,
            자기소개(선택) 등
          </li>
          <li>
            <strong>파일 업로드 시 수집항목:</strong> 파일 메타데이터(제목,
            설명, 카테고리), 업로더 이메일, 업로드 일시, 파일 암호화
            여부·알고리즘 등
          </li>
          <li>
            <strong>로그 이용 기록:</strong> 로그인·로그아웃 시각, IP 주소, 접속
            로그 등
          </li>
          <li>
            <strong>쿠키 및 유사 기술:</strong> 서비스 이용 편의 제공을 위한
            쿠키, 로컬스토리지 등
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700">
          2. 개인정보 수집 및 이용 목적
        </h2>
        <ol className="list-decimal list-inside text-gray-600 space-y-2">
          <li>
            서비스 가입 및 관리: 회원 식별, 가입 의사 확인, 가입·탈퇴 관리 등을
            위해 사용합니다.
          </li>
          <li>
            서비스 제공: 파일 업로드·다운로드, 암호화·복호화 기능 제공, 프로필
            표시 등을 위해 사용합니다.
          </li>
          <li>
            고객 문의 및 민원 처리: 문의사항 응대, 불만 처리, 기술적 문제 해결
            등을 위해 사용합니다.
          </li>
          <li>
            서비스 개선 및 고도화: 서비스 이용 통계 분석, 맞춤형 서비스 및 신규
            기능 개발을 위해 사용합니다.
          </li>
          <li>
            부정 이용 방지: 불법 프로그램 방지, 보안 서비스 제공, 비인가 사용
            방지 및 피해 예방을 위해 사용합니다.
          </li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700">
          3. 개인정보 보유 및 이용 기간
        </h2>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>
            회원의 개인정보는 회원 탈퇴 시 지체 없이 파기합니다. 다만, 관련
            법령에 정해진 바에 따라 일정 기간 보관해야 하는 정보는 그 기간 동안
            보관 후 파기합니다.
          </li>
          <li>
            <strong>보관 예시:</strong>
            <ul className="list-disc list-inside ml-4 text-gray-600 space-y-1">
              <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
              <li>대금 결제 및 재화 등의 공급에 관한 기록: 5년</li>
              <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
            </ul>
          </li>
          <li>
            비회원이 업로드한 파일은 업로더가 직접 삭제를 요청하거나, 서비스
            정책상 일정 기간(예: 1년) 미사용 시 자동 삭제될 수 있습니다.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700">
          4. 개인정보 제3자 제공
        </h2>
        <p className="text-gray-600">
          회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만,
          아래의 경우 예외적으로 개인정보를 제공할 수 있습니다.
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>이용자가 사전에 동의한 경우</li>
          <li>
            법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에
            따라 수사기관의 요청이 있는 경우
          </li>
          <li>
            서비스 운영을 위해 필요한 경우 (예: 결제 대행, 클라우드 호스팅 등
            외부 업체에 업무를 위탁할 때)
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700">
          5. 개인정보 처리 위탁
        </h2>
        <p className="text-gray-600">
          회사는 원활한 서비스 제공을 위하여 아래와 같이 개인정보 처리를 외부에
          위탁할 수 있습니다.
        </p>
        <table className="w-full text-left border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border border-gray-200">수탁업체</th>
              <th className="p-2 border border-gray-200">위탁업무 내용</th>
              <th className="p-2 border border-gray-200">보유 기간</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border border-gray-200">A 클라우드 호스팅</td>
              <td className="p-2 border border-gray-200">
                서버 운영 및 데이터 저장
              </td>
              <td className="p-2 border border-gray-200">회원 탈퇴 시까지</td>
            </tr>
            <tr>
              <td className="p-2 border border-gray-200">B 메일 서비스</td>
              <td className="p-2 border border-gray-200">
                이메일 인증 및 알림 발송
              </td>
              <td className="p-2 border border-gray-200">회원 탈퇴 시까지</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700">
          6. 이용자의 권리 및 그 행사 방법
        </h2>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>
            이용자는 언제든지 개인정보 조회, 수정, 삭제, 처리 정지를 요청할 수
            있습니다. ("내 프로필" 페이지 또는 고객센터로 문의)
          </li>
          <li>
            이용자가 개인정보 오류를 발견한 경우 정정을 요청할 수 있으며, 회사는
            즉시 정정 및 복구합니다.
          </li>
          <li>
            삭제 요청 시, 관련 법령에 따라 보존해야 하는 정보(계약, 대금 결제,
            분쟁 기록 등)는 해당 기간 동안 보관합니다.
          </li>
          <li>
            권리 행사는 정보주체 또는 대리인이 서면, 전자우편, 전화 등의
            방법으로 회사에 요청할 수 있으며, 회사는 지체 없이 조치합니다.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700">
          7. 쿠키 운영 방침
        </h2>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>
            회사는 서비스 편의 제공을 위해 쿠키(cookie)를 사용합니다. 쿠키는
            이용자의 PC에 저장되는 작은 데이터 파일로, 접속 정보를 저장하고
            맞춤형 서비스를 제공할 수 있도록 합니다.
          </li>
          <li>
            쿠키 사용 목적:
            <ul className="list-disc list-inside ml-4 text-gray-600 space-y-1">
              <li>로그인 상태 유지</li>
              <li>이용자 선호도 파악 및 맞춤 서비스 제공</li>
              <li>서비스 이용 통계분석</li>
            </ul>
          </li>
          <li>
            쿠키 설정 거부 방법:
            <ul className="list-disc list-inside ml-4 text-gray-600 space-y-1">
              <li>
                웹 브라우저 상단 설정(도구 → 인터넷 옵션 → 개인정보) 메뉴에서
                쿠키 사용 거부
              </li>
              <li>모바일: 환경설정 → 개인정보(또는 보안) → 쿠키 차단 설정</li>
            </ul>
          </li>
          <li>
            단, 쿠키 저장을 거부할 경우 로그인, 맞춤형 서비스 등 일부 기능
            이용에 제한이 있을 수 있습니다.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700">
          8. 개인정보 파기 절차 및 방법
        </h2>
        <ol className="list-decimal list-inside text-gray-600 space-y-2">
          <li>
            <strong>파기 절차:</strong> 이용자가 회원 탈퇴, 동의 철회 등의
            사유로 개인정보 삭제를 요청하거나 개인정보 보유 기간이 만료된 경우,
            내부 방침에 따라 즉시 파기합니다.
          </li>
          <li>
            <strong>파기 방법:</strong>
            <ul className="list-disc list-inside ml-4 text-gray-600 space-y-1">
              <li>
                전자적 파일 형태로 저장된 개인정보는 복구 불가능한 방법으로 영구
                삭제
              </li>
              <li>종이에 출력된 문서는 분쇄기로 분쇄하거나 소각</li>
            </ul>
          </li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700">
          9. 개인정보 보호책임자
        </h2>
        <p className="text-gray-600">
          회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와
          관련한 이용자의 불만 처리를 위하여 아래와 같이 개인정보 보호책임자를
          지정하고 있습니다.
        </p>
        <table className="w-full text-left border-collapse border border-gray-200">
          <tbody>
            <tr>
              <td className="p-2 border border-gray-200 font-semibold">
                개인정보 보호책임자
              </td>
              <td className="p-2 border border-gray-200">강희수</td>
            </tr>
            <tr>
              <td className="p-2 border border-gray-200 font-semibold">
                소속 및 직위
              </td>
              <td className="p-2 border border-gray-200">조장</td>
            </tr>
            <tr>
              <td className="p-2 border border-gray-200 font-semibold">
                연락처
              </td>
              <td className="p-2 border border-gray-200">
                이메일: privacy@safeshare.com
                <br />
                전화: 02-1234-5678
              </td>
            </tr>
          </tbody>
        </table>
        <p className="text-gray-600">
          ※ 기타 개인정보 침해 관련 문의는 한국인터넷진흥원
          개인정보침해신고센터(www.kisa.or.kr)에 문의하시기 바랍니다.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700">
          10. 고지 의무 및 시행일
        </h2>
        <ol className="list-decimal list-inside text-gray-600 space-y-2">
          <li>현 개인정보 처리방침은 2025년 6월 1일부터 적용됩니다.</li>
          <li>
            법령 및 회사 정책에 따라 내용이 변경될 경우 변경사항을 사전
            공지합니다.
          </li>
        </ol>
      </section>
    </main>
  )
}

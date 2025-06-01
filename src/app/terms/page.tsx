// 파일 경로: src/app/terms/page.tsx
'use client'

import React from 'react'

export default function TermsOfServicePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <h1 className="text-3xl font-bold text-center text-purple-600">
        이용약관 (Terms of Service)
      </h1>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700">1. 총칙</h2>
        <p className="text-gray-600">
          본 약관은 SafeShare(이하 “회사”라 합니다)가 제공하는 암호화 파일 공유
          서비스(이하 “서비스”라 합니다)를 이용함에 있어 회사와 이용자의
          권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
        </p>
        <p className="text-gray-600">
          이용자는 본 약관에 동의함으로써 서비스 이용과 관련하여 다음 각 조에
          동의하는 것으로 간주됩니다.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700">2. 정의</h2>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>
            <strong>이용자:</strong> 서비스에 접속하여 본 약관에 따라 회사가
            제공하는 서비스를 받는 회원 및 비회원을 말합니다.
          </li>
          <li>
            <strong>회원:</strong> 회사가 정한 가입 절차에 따라 개인정보를
            제공하고 회원으로 등록된 자로서, 회사가 제공하는 서비스를 지속적으로
            이용할 수 있는 자를 말합니다.
          </li>
          <li>
            <strong>비회원:</strong> 회원에 가입하지 않고 회사가 제공하는
            서비스를 이용하는 자를 말합니다. 다만, 비회원은 서비스 내 일부
            기능이 제한될 수 있습니다.
          </li>
          <li>
            <strong>콘텐츠:</strong> 회원이 서비스에 업로드하는 파일(문서,
            이미지, 동영상 등)의 암호화된/비암호화된 데이터 및 해당 파일과
            관련된 메타데이터(제목, 설명, 카테고리 등)를 포함합니다.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700">
          3. 약관의 게시 및 개정
        </h2>
        <ol className="list-decimal list-inside text-gray-600 space-y-2">
          <li>
            회사는 본 약관의 내용을 서비스 초기 화면(또는 연결 화면)에
            게시합니다. 약관의 주요 조항(이용자의 권리·의무, 책임 제한 등)은
            별도 눈에 잘 띄는 곳에 게시합니다.
          </li>
          <li>
            회사는 필요하다고 인정되는 경우 관련 법령에 위배되지 않는 범위에서
            이 약관을 개정할 수 있습니다. 개정된 약관은 적용일자 및 개정사유를
            명시하여 현격히 공지합니다. 적용일자 경과 후 서비스를 이용하는
            이용자는 개정된 약관에 동의한 것으로 간주됩니다.
          </li>
          <li>
            이용자는 개정약관에 동의하지 않을 경우 서비스 이용을 중단하고 탈퇴할
            수 있습니다.
          </li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700">
          4. 서비스 이용 계약
        </h2>
        <ol className="list-decimal list-inside text-gray-600 space-y-2">
          <li>
            <strong>이용 계약의 성립:</strong> 이용 계약은 이용자가 약관에
            동의하고 회원가입 신청을 완료한 후 회사가 이를 승낙함으로써
            성립합니다.
          </li>
          <li>
            <strong>회원가입 신청:</strong> 이용자는 회사가 정한 양식에 따라
            이메일, 비밀번호 등 필수 정보를 제공하고 회원가입을 신청합니다.
          </li>
          <li>
            <strong>회원가입 승낙:</strong> 회사는 이용 신청 시, 서비스 이용을
            위해 필요한 정보를 확인하고 특별한 사유가 없는 한 승낙합니다. 다만,
            다음 각 호의 사유가 있을 경우 승낙을 보류하거나 거부할 수 있습니다.
            <ul className="list-disc list-inside ml-4 text-gray-600 space-y-1">
              <li>가입 신청자의 정보가 허위이거나 타인의 정보를 도용한 경우</li>
              <li>
                사회적 비난 가능성이 있거나 회사 업무 수행에 지장을 줄 우려가
                있는 경우
              </li>
              <li>기타 회사가 정한 가입 요건을 충족하지 못한 경우</li>
            </ul>
          </li>
          <li>
            <strong>회원탈퇴:</strong> 회원은 언제든지 탈퇴를 요청할 수 있으며,
            회사는 즉시 탈퇴를 처리합니다. 단, 탈퇴 시 해당 회원의 콘텐츠 및
            데이터는 삭제되며 복구되지 않습니다.
          </li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700">5. 서비스 이용</h2>
        <h3 className="text-xl font-semibold text-gray-700">
          5.1. 회원의 의무
        </h3>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>
            회원은 서비스 이용 시 다음 각 호를 준수해야 합니다.
            <ul className="list-disc list-inside ml-4 text-gray-600 space-y-1">
              <li>
                회원 정보(이메일, 비밀번호 등)는 정확하게 기재해야 합니다.
              </li>
              <li>
                타인의 정보로 부정 사용하거나 제3자에게 양도 및 대여할 수
                없습니다.
              </li>
              <li>
                서비스의 원활한 운영을 방해하거나 시스템에 해를 끼치는 행위를
                해서는 안 됩니다.
              </li>
              <li>
                저작권 등 타인의 권리를 침해하거나 명예를 훼손하는 행위를 해서는
                안 됩니다.
              </li>
              <li>관련 법령 및 본 약관을 준수해야 합니다.</li>
            </ul>
          </li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-700">
          5.2. 콘텐츠 업로드 및 공유
        </h3>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>
            회원은 파일을 업로드할 때, 해당 파일에 대한 저작권·초상권 등 제반
            권리를 보유하거나 합법적으로 사용할 수 있는 권리를 가지고 있어야
            합니다.
          </li>
          <li>
            업로드된 파일은 기본적으로 암호화되어 저장되며, 소유자만 비밀번호
            입력을 통해 복호화할 수 있습니다. 파일 다운로드 시, 올바른
            권한(비밀번호 등)을 입력해야 콘텐츠를 받을 수 있습니다.
          </li>
          <li>
            회원은 타인의 파일을 무단으로 복제, 배포, 전시, 공연, 전송하거나 2차
            저작물을 작성해서는 안 됩니다.
          </li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-700">
          5.3. 서비스 제공의 중단
        </h3>
        <ol className="list-decimal list-inside text-gray-600 space-y-2">
          <li>
            회사는 다음 각 호에 해당하는 경우 서비스 제공을 일시적으로 중단할 수
            있습니다.
            <ul className="list-disc list-inside ml-4 text-gray-600 space-y-1">
              <li>
                정기 점검, 긴급 점검, 시스템 교체, 업그레이드 등을 위해 필요한
                경우
              </li>
              <li>
                서비스용 설비의 보수, 교체, 정기점검 등 설비의 이상이 발생한
                경우
              </li>
              <li>서비스 제공을 위해 긴급한 필요가 발생한 경우</li>
            </ul>
          </li>
          <li>
            본 조에 의한 서비스 중단의 경우 회사는 사전에 공지하되, 불가피한
            사유(정전, 점검, 방화벽 장애 등)로 인해 사전 공지가 불가능한 경우
            사후 공지할 수 있습니다.
          </li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700">6. 지적 재산권</h2>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>
            서비스 및 서비스에 포함된 모든 콘텐츠(디자인, 텍스트, 이미지, 코드
            등)에 대한 저작권 및 지적 재산권은 회사 또는 정당한 권리자에게
            귀속됩니다.
          </li>
          <li>
            회원은 서비스를 이용함으로써 얻은 정보를 회사의 사전 승낙 없이 복제,
            송신, 출판, 배포, 방송, 기타 방법으로 이용하거나 제3자에게 이용하게
            하여서는 안 됩니다.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700">7. 책임의 제한</h2>
        <ol className="list-decimal list-inside text-gray-600 space-y-2">
          <li>
            회사는 서비스를 통해 회원이 업로드하거나 다운로드한 데이터의 안전 및
            신뢰성에 대해 최선을 다해 보장하나, 천재지변, 해킹, 삭제된 데이터의
            복구, 제3자의 고의·과실 등 불가항력적 사유로 인한 데이터 손실에 대해
            책임을 지지 않습니다.
          </li>
          <li>
            회사는 회원이 서비스를 이용하여 기대하는 이익을 얻지 못하거나 상실된
            이익에 대해 책임을 지지 않습니다.
          </li>
          <li>
            회사는 회원이 서비스를 이용함에 있어 발생한 어떠한 손해(직접/간접,
            물적/정신적 피해 포함)에 대해 관련 법령이 정하는 범위 내에서 책임을
            부담합니다.
          </li>
          <li>
            회사는 회원 상호 간 또는 회원과 제3자 상호 간에 서비스를 매개로
            발생한 분쟁에 대해 개입하지 않으며, 이로 인한 손해나 법적 책임은
            당사자 간의 책임으로 합니다.
          </li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700">
          8. 개인정보 보호
        </h2>
        <p className="text-gray-600">
          회사는 회원의 개인정보를 보호하기 위해 관련 법령(「개인정보 보호법」
          등)에 따라 개인정보 처리방침을 수립·공개하고 준수합니다. 자세한 내용은{' '}
          <a href="/privacy" className="text-purple-600 underline">
            개인정보 처리방침
          </a>
          을 참조하십시오.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700">9. 약관의 변경</h2>
        <ol className="list-decimal list-inside text-gray-600 space-y-2">
          <li>
            회사는 관련 법령을 위배하지 않는 범위 내에서 본 약관을 변경할 수
            있습니다.
          </li>
          <li>
            변경된 약관은 적용일자 및 변경사유를 명시하여 공지한 후 적용일자
            이후 서비스 이용 시 효력이 발생합니다.
          </li>
          <li>
            이용자는 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고
            탈퇴할 수 있습니다. 다만 변경된 약관 공지 후 7일 이내에 별도의 이의
            제기가 없으면 약관에 동의한 것으로 간주됩니다.
          </li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700">10. 기타</h2>
        <ol className="list-decimal list-inside text-gray-600 space-y-2">
          <li>
            본 약관에서 정하지 않은 사항은 관련 법령 및 회사가 정한 운영정책에
            따릅니다.
          </li>
          <li>
            본 약관에 규정된 콘텐츠는 대한민국 법령을 준거법으로 하며, 서비스
            이용과 관련하여 발생한 분쟁에 대해서는 회사 본사 소재지를 관할하는
            법원을 제1심 법원으로 합니다.
          </li>
          <li>
            회사의 연락처 정보:
            <ul className="list-disc list-inside ml-4 text-gray-600 space-y-1">
              <li>이메일: support@safeshare.com</li>
              <li>전화번호: 02-1234-5678</li>
            </ul>
          </li>
        </ol>
      </section>
    </main>
  )
}

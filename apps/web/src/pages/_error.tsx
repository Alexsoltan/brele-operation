import type { NextPageContext } from "next";

type ErrorPageProps = {
  statusCode?: number;
};

function ErrorPage({ statusCode }: ErrorPageProps) {
  return (
    <div style={{ padding: 32, fontFamily: "sans-serif" }}>
      <h1>Ошибка</h1>
      <p>
        {statusCode
          ? `Ошибка сервера: ${statusCode}`
          : "Произошла ошибка на клиенте."}
      </p>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 404;
  return { statusCode };
};

export default ErrorPage;
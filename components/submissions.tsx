"use client";

import { useEffect, useState } from "react";
import { Phone, Mail, ChevronLeft, ChevronRight } from "lucide-react";
import { ContactSubmission, SubmissionsResponse } from "@/lib/types";

export function Submissions({
  initialData,
  initialLoaded
}: {
  initialData: SubmissionsResponse | null;
  initialLoaded: boolean;
}) {
  const [data, setData] = useState<SubmissionsResponse | null>(initialData);
  const [loading, setLoading] = useState(!initialLoaded);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!initialLoaded) {
      const loadSubmissions = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/submissions?page=${currentPage}&pageSize=${pageSize}`);
          if (!response.ok) throw new Error("Failed to fetch submissions");
          const json = (await response.json()) as SubmissionsResponse;
          setData(json);
        } catch (error) {
          console.error("Error loading submissions:", error);
          setData(null);
        } finally {
          setLoading(false);
        }
      };

      void loadSubmissions();
    }
    // Intentionally run only once during hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentPage === 1) return;

    const loadPage = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/submissions?page=${currentPage}&pageSize=${pageSize}`);
        if (!response.ok) throw new Error("Failed to fetch submissions");
        const json = (await response.json()) as SubmissionsResponse;
        setData(json);
      } catch (error) {
        console.error("Error loading submissions:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadPage();
  }, [currentPage]);

  const handleCall = (phone: string | null) => {
    if (!phone) {
      alert("No phone number provided");
      return;
    }
    window.location.href = `tel:${phone}`;
  };

  const handleEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleNextPage = () => {
    if (data && currentPage < data.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading && !data) {
    return (
      <main className="shell">
        <section className="hero">
          <div className="hero-brand">
            <img
              src="/logo.jpeg"
              alt="Architectural office logo"
              width="200"
              height="200"
              className="hero-logo"
            />
          </div>
          <img src="/OIP.png" alt="Architectural office logo" width="200" height="200" className="house3d" />
        </section>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p>Loading submissions...</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="shell">
        <section className="hero">
          <div className="hero-brand">
            <img
              src="/logo.jpeg"
              alt="Architectural office logo"
              width="200"
              height="200"
              className="hero-logo"
            />
          </div>
          <img src="/OIP.png" alt="Architectural office logo" width="200" height="200" className="house3d" />
        </section>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ color: "#d84949" }}>Failed to load submissions</p>
        </div>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-brand">
          <img
            src="/logo.jpeg"
            alt="Architectural office logo"
            width="200"
            height="200"
            className="hero-logo"
          />
        </div>
        <img src="/OIP.png" alt="Architectural office logo" width="200" height="200" className="house3d" />
      </section>

      <section style={{ padding: "2rem" }}>
        <h1 style={{ marginBottom: "2rem", color: "#f2f6ff" }}>Contact Submissions</h1>

        {data.submissions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#9cafcc" }}>
            <p>No submissions yet</p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gap: "1rem",
                marginBottom: "2rem"
              }}
            >
              {data.submissions.map((submission) => (
                <div
                  key={submission.id}
                  style={{
                    padding: "1.5rem",
                    borderRadius: "12px",
                    border: "1px solid rgba(98, 133, 202, 0.26)",
                    background: "linear-gradient(180deg, rgba(23, 31, 51, 0.5), rgba(14, 19, 31, 0.7))",
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "2rem",
                    alignItems: "start"
                  }}
                >
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    <div>
                      <p style={{ color: "#9cafcc", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                        Full Name
                      </p>
                      <p style={{ color: "#f2f6ff", fontWeight: 500 }}>{submission.fullName}</p>
                    </div>

                    <div>
                      <p style={{ color: "#9cafcc", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                        Email
                      </p>
                      <p style={{ color: "#f2f6ff", fontFamily: "monospace", fontSize: "0.9rem" }}>
                        {submission.email}
                      </p>
                    </div>

                    {submission.phone && (
                      <div>
                        <p style={{ color: "#9cafcc", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                          Phone
                        </p>
                        <p style={{ color: "#f2f6ff", fontFamily: "monospace", fontSize: "0.9rem" }}>
                          {submission.phone}
                        </p>
                      </div>
                    )}

                    {submission.projectType && (
                      <div>
                        <p style={{ color: "#9cafcc", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                          Project Type
                        </p>
                        <p style={{ color: "#f2f6ff" }}>{submission.projectType}</p>
                      </div>
                    )}

                    <div>
                      <p style={{ color: "#9cafcc", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                        Message
                      </p>
                      <p
                        style={{
                          color: "#f2f6ff",
                          lineHeight: 1.5,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word"
                        }}
                      >
                        {submission.message}
                      </p>
                    </div>

                    <div>
                      <p style={{ color: "#9cafcc", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                        Submitted
                      </p>
                      <p style={{ color: "#f2f6ff", fontSize: "0.9rem" }}>
                        {new Date(submission.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <button
                      onClick={() => handleEmail(submission.email)}
                      style={{
                        padding: "0.75rem 1rem",
                        borderRadius: "8px",
                        border: "1px solid rgba(98, 133, 202, 0.5)",
                        background: "linear-gradient(180deg, rgba(74, 110, 168, 0.3), rgba(48, 76, 124, 0.3))",
                        color: "#f2f6ff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        transition: "all 0.2s ease",
                        whiteSpace: "nowrap"
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          "linear-gradient(180deg, rgba(74, 110, 168, 0.5), rgba(48, 76, 124, 0.5))";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          "linear-gradient(180deg, rgba(74, 110, 168, 0.3), rgba(48, 76, 124, 0.3))";
                      }}
                    >
                      <Mail size={16} />
                      Email
                    </button>

                    {submission.phone && (
                      <button
                        onClick={() => handleCall(submission.phone)}
                        style={{
                          padding: "0.75rem 1rem",
                          borderRadius: "8px",
                          border: "1px solid rgba(98, 133, 202, 0.5)",
                          background: "linear-gradient(180deg, rgba(74, 110, 168, 0.3), rgba(48, 76, 124, 0.3))",
                          color: "#f2f6ff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontSize: "0.9rem",
                          fontWeight: 500,
                          transition: "all 0.2s ease",
                          whiteSpace: "nowrap"
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background =
                            "linear-gradient(180deg, rgba(74, 110, 168, 0.5), rgba(48, 76, 124, 0.5))";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background =
                            "linear-gradient(180deg, rgba(74, 110, 168, 0.3), rgba(48, 76, 124, 0.3))";
                        }}
                      >
                        <Phone size={16} />
                        Call
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1.5rem",
                borderRadius: "12px",
                border: "1px solid rgba(98, 133, 202, 0.26)",
                background: "linear-gradient(180deg, rgba(23, 31, 51, 0.5), rgba(14, 19, 31, 0.7))"
              }}
            >
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    border: "1px solid rgba(98, 133, 202, 0.5)",
                    background: currentPage === 1 ? "rgba(98, 133, 202, 0.1)" : "rgba(98, 133, 202, 0.2)",
                    color: currentPage === 1 ? "#6b7d9b" : "#f2f6ff",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.9rem"
                  }}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <span style={{ color: "#9cafcc", fontSize: "0.9rem" }}>
                  Page <strong style={{ color: "#f2f6ff" }}>{currentPage}</strong> of{" "}
                  <strong style={{ color: "#f2f6ff" }}>{data.totalPages}</strong>
                </span>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= data.totalPages}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    border: "1px solid rgba(98, 133, 202, 0.5)",
                    background: currentPage >= data.totalPages ? "rgba(98, 133, 202, 0.1)" : "rgba(98, 133, 202, 0.2)",
                    color: currentPage >= data.totalPages ? "#6b7d9b" : "#f2f6ff",
                    cursor: currentPage >= data.totalPages ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.9rem"
                  }}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>

              <div style={{ color: "#9cafcc", fontSize: "0.9rem" }}>
                Total submissions: <strong style={{ color: "#f2f6ff" }}>{data.total}</strong>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

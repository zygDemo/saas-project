--
-- PostgreSQL database dump
--

\restrict MfHliJYCWRij532YfsgmuuxVORu8oY9hjC6jF2RUe7DPQHIpVdKYvVieoSo2Mcq

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ApplicationStatus; Type: TYPE; Schema: public; Owner: saas_user
--

CREATE TYPE public."ApplicationStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'PENDING_FIRST_REVIEW',
    'FIRST_REVIEW_PASSED',
    'FIRST_REVIEW_REJECTED',
    'PENDING_SUPPLEMENT',
    'PENDING_FINAL_REVIEW',
    'FINAL_REVIEW_PASSED',
    'FINAL_REVIEW_REJECTED',
    'PENDING_FUNDER_REVIEW',
    'FUNDER_REVIEW_PASSED',
    'FUNDER_REVIEW_REJECTED',
    'PENDING_SIGN',
    'SIGNED',
    'PENDING_DISBURSEMENT',
    'DISBURSED',
    'CANCELLED',
    'PENDING_RISK_PRE',
    'RISK_PRE_PASSED',
    'RISK_PRE_REJECTED',
    'PENDING_FUNDER_PRE',
    'FUNDER_PRE_PASSED',
    'FUNDER_PRE_REJECTED',
    'SIGNING_PROGRESS',
    'PENDING_LOAN_REQUEST',
    'LOAN_REQUEST_REVIEWING',
    'LOAN_REQUEST_APPROVED',
    'LOAN_REQUEST_REJECTED'
);


ALTER TYPE public."ApplicationStatus" OWNER TO saas_user;

--
-- Name: ApprovalAction; Type: TYPE; Schema: public; Owner: saas_user
--

CREATE TYPE public."ApprovalAction" AS ENUM (
    'PASS',
    'REJECT',
    'SUPPLEMENT',
    'TRANSFER',
    'RETURN',
    'REMARK'
);


ALTER TYPE public."ApprovalAction" OWNER TO saas_user;

--
-- Name: DisbursementStatus; Type: TYPE; Schema: public; Owner: saas_user
--

CREATE TYPE public."DisbursementStatus" AS ENUM (
    'PENDING_APPLICATION',
    'PENDING_APPROVAL',
    'GPS_INSTALLED',
    'MORTGAGE_DONE',
    'DISBURSED',
    'FAILED'
);


ALTER TYPE public."DisbursementStatus" OWNER TO saas_user;

--
-- Name: Gender; Type: TYPE; Schema: public; Owner: saas_user
--

CREATE TYPE public."Gender" AS ENUM (
    'MALE',
    'FEMALE',
    'UNKNOWN'
);


ALTER TYPE public."Gender" OWNER TO saas_user;

--
-- Name: LeadStatus; Type: TYPE; Schema: public; Owner: saas_user
--

CREATE TYPE public."LeadStatus" AS ENUM (
    'PENDING_ASSIGN',
    'PENDING_FOLLOW',
    'FOLLOWING',
    'CONVERTED',
    'INVALID',
    'DORMANT',
    'PUBLIC_POOL'
);


ALTER TYPE public."LeadStatus" OWNER TO saas_user;

--
-- Name: OrgStatus; Type: TYPE; Schema: public; Owner: saas_user
--

CREATE TYPE public."OrgStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED'
);


ALTER TYPE public."OrgStatus" OWNER TO saas_user;

--
-- Name: RepaymentStatus; Type: TYPE; Schema: public; Owner: saas_user
--

CREATE TYPE public."RepaymentStatus" AS ENUM (
    'NOT_DUE',
    'PENDING',
    'PARTIAL',
    'PAID',
    'OVERDUE',
    'SETTLED'
);


ALTER TYPE public."RepaymentStatus" OWNER TO saas_user;

--
-- Name: SignStatus; Type: TYPE; Schema: public; Owner: saas_user
--

CREATE TYPE public."SignStatus" AS ENUM (
    'PENDING',
    'SENT',
    'SIGNED',
    'VIDEO_INTERVIEW_DONE',
    'EXPIRED',
    'CANCELLED'
);


ALTER TYPE public."SignStatus" OWNER TO saas_user;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: saas_user
--

CREATE TYPE public."UserStatus" AS ENUM (
    'ONLINE',
    'OFFLINE',
    'ABNORMAL',
    'DISABLED'
);


ALTER TYPE public."UserStatus" OWNER TO saas_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Application; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."Application" (
    id integer NOT NULL,
    "orgId" integer NOT NULL,
    "customerId" integer NOT NULL,
    "productId" integer,
    "funderId" integer,
    "applicationNo" text NOT NULL,
    amount numeric(15,2) NOT NULL,
    term integer NOT NULL,
    rate numeric(5,4) NOT NULL,
    "repaymentMethod" text NOT NULL,
    purpose text,
    status public."ApplicationStatus" DEFAULT 'DRAFT'::public."ApplicationStatus" NOT NULL,
    "creatorId" integer NOT NULL,
    "sourceLeadId" integer,
    "supplementReason" text,
    "supplementDeadline" timestamp(3) without time zone,
    "approvedAmount" numeric(15,2),
    "approvedTerm" integer,
    "approvedRate" numeric(5,4),
    remark text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tenantId" integer NOT NULL,
    "businessType" text DEFAULT 'CAR_LOAN'::text NOT NULL,
    "currentNode" integer DEFAULT 1100 NOT NULL,
    "currentStatus" integer DEFAULT 10 NOT NULL
);


ALTER TABLE public."Application" OWNER TO saas_user;

--
-- Name: ApplicationFile; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."ApplicationFile" (
    id integer NOT NULL,
    "applicationId" integer NOT NULL,
    "fileType" text NOT NULL,
    "fileUrl" text NOT NULL,
    "fileName" text,
    "ocrResult" jsonb,
    "isValid" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ApplicationFile" OWNER TO saas_user;

--
-- Name: ApplicationFile_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."ApplicationFile_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ApplicationFile_id_seq" OWNER TO saas_user;

--
-- Name: ApplicationFile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."ApplicationFile_id_seq" OWNED BY public."ApplicationFile".id;


--
-- Name: Application_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."Application_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Application_id_seq" OWNER TO saas_user;

--
-- Name: Application_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."Application_id_seq" OWNED BY public."Application".id;


--
-- Name: ApprovalRecord; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."ApprovalRecord" (
    id integer NOT NULL,
    "applicationId" integer NOT NULL,
    "approverId" integer NOT NULL,
    stage text NOT NULL,
    action public."ApprovalAction" NOT NULL,
    opinion text,
    amount numeric(15,2),
    term integer,
    rate numeric(5,4),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "tenantId" integer NOT NULL
);


ALTER TABLE public."ApprovalRecord" OWNER TO saas_user;

--
-- Name: ApprovalRecord_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."ApprovalRecord_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ApprovalRecord_id_seq" OWNER TO saas_user;

--
-- Name: ApprovalRecord_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."ApprovalRecord_id_seq" OWNED BY public."ApprovalRecord".id;


--
-- Name: BankCard; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."BankCard" (
    id integer NOT NULL,
    "customerId" integer NOT NULL,
    "bankName" text NOT NULL,
    "cardNo" text NOT NULL,
    "cardType" text NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."BankCard" OWNER TO saas_user;

--
-- Name: BankCard_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."BankCard_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."BankCard_id_seq" OWNER TO saas_user;

--
-- Name: BankCard_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."BankCard_id_seq" OWNED BY public."BankCard".id;


--
-- Name: Customer; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."Customer" (
    id integer NOT NULL,
    "orgId" integer NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    "idCard" text,
    gender public."Gender" DEFAULT 'UNKNOWN'::public."Gender" NOT NULL,
    "birthDate" timestamp(3) without time zone,
    "maritalStatus" text,
    education text,
    occupation text,
    "companyName" text,
    "monthlyIncome" numeric(15,2),
    address text,
    "emergencyName" text,
    "emergencyPhone" text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tenantId" integer NOT NULL,
    nation text,
    "householdAddress" text,
    "issuingAuthority" text,
    "idCardValidFrom" text,
    "idCardValidTo" text,
    "idCardFront" text,
    "idCardBack" text
);


ALTER TABLE public."Customer" OWNER TO saas_user;

--
-- Name: CustomerContact; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."CustomerContact" (
    id integer NOT NULL,
    "customerId" integer NOT NULL,
    name text NOT NULL,
    relation text NOT NULL,
    phone text NOT NULL,
    address text,
    "isEmergency" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."CustomerContact" OWNER TO saas_user;

--
-- Name: CustomerContact_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."CustomerContact_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."CustomerContact_id_seq" OWNER TO saas_user;

--
-- Name: CustomerContact_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."CustomerContact_id_seq" OWNED BY public."CustomerContact".id;


--
-- Name: Customer_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."Customer_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Customer_id_seq" OWNER TO saas_user;

--
-- Name: Customer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."Customer_id_seq" OWNED BY public."Customer".id;


--
-- Name: Department; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."Department" (
    id integer NOT NULL,
    "orgId" integer NOT NULL,
    "parentId" integer,
    name text NOT NULL,
    "managerId" integer,
    sort integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tenantId" integer NOT NULL
);


ALTER TABLE public."Department" OWNER TO saas_user;

--
-- Name: Department_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."Department_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Department_id_seq" OWNER TO saas_user;

--
-- Name: Department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."Department_id_seq" OWNED BY public."Department".id;


--
-- Name: DictData; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."DictData" (
    id integer NOT NULL,
    "tenantId" integer NOT NULL,
    "typeId" integer NOT NULL,
    label text NOT NULL,
    value text NOT NULL,
    sort integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    remark text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DictData" OWNER TO saas_user;

--
-- Name: DictData_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."DictData_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."DictData_id_seq" OWNER TO saas_user;

--
-- Name: DictData_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."DictData_id_seq" OWNED BY public."DictData".id;


--
-- Name: DictType; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."DictType" (
    id integer NOT NULL,
    "tenantId" integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    remark text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DictType" OWNER TO saas_user;

--
-- Name: DictType_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."DictType_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."DictType_id_seq" OWNER TO saas_user;

--
-- Name: DictType_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."DictType_id_seq" OWNED BY public."DictType".id;


--
-- Name: Disbursement; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."Disbursement" (
    id integer NOT NULL,
    "applicationId" integer NOT NULL,
    status public."DisbursementStatus" DEFAULT 'PENDING_APPLICATION'::public."DisbursementStatus" NOT NULL,
    "gpsDeviceNo" text,
    "gpsInstallImg" text,
    "gpsInstallAt" timestamp(3) without time zone,
    "mortgageStatus" text,
    "mortgageImg" text,
    "mortgageAt" timestamp(3) without time zone,
    "disburseAmount" numeric(15,2),
    "disburseAccount" text,
    "disburseAt" timestamp(3) without time zone,
    "transactionNo" text,
    "voucherUrl" text,
    remark text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tenantId" integer NOT NULL
);


ALTER TABLE public."Disbursement" OWNER TO saas_user;

--
-- Name: Disbursement_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."Disbursement_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Disbursement_id_seq" OWNER TO saas_user;

--
-- Name: Disbursement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."Disbursement_id_seq" OWNED BY public."Disbursement".id;


--
-- Name: FileAsset; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."FileAsset" (
    id integer NOT NULL,
    "tenantId" integer NOT NULL,
    "orgId" integer,
    "businessType" text,
    "businessId" integer,
    "categoryCode" text NOT NULL,
    "categoryName" text NOT NULL,
    "fileName" text NOT NULL,
    "fileUrl" text NOT NULL,
    "objectKey" text,
    "mimeType" text,
    "fileExt" text,
    "fileSize" integer,
    "storageType" text DEFAULT 'LOCAL'::text NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "uploadedBy" integer,
    remark text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."FileAsset" OWNER TO saas_user;

--
-- Name: FileAsset_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."FileAsset_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."FileAsset_id_seq" OWNER TO saas_user;

--
-- Name: FileAsset_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."FileAsset_id_seq" OWNED BY public."FileAsset".id;


--
-- Name: FlowConfig; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."FlowConfig" (
    id integer NOT NULL,
    "tenantId" integer NOT NULL,
    "orgId" integer NOT NULL,
    name text NOT NULL,
    "businessType" text NOT NULL,
    "nodeCode" text NOT NULL,
    "nodeName" text NOT NULL,
    "approveLevel" integer DEFAULT 1 NOT NULL,
    "amountLimit" numeric(15,2),
    "timeoutHours" integer,
    "requireMaterials" boolean DEFAULT false NOT NULL,
    "requireApproval" boolean DEFAULT true NOT NULL,
    "autoPass" boolean DEFAULT false NOT NULL,
    "ruleConfig" jsonb,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    remark text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."FlowConfig" OWNER TO saas_user;

--
-- Name: FlowConfig_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."FlowConfig_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."FlowConfig_id_seq" OWNER TO saas_user;

--
-- Name: FlowConfig_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."FlowConfig_id_seq" OWNED BY public."FlowConfig".id;


--
-- Name: Funder; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."Funder" (
    id integer NOT NULL,
    "orgId" integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    "funderType" text NOT NULL,
    "contactName" text,
    "contactPhone" text,
    "apiConfig" jsonb,
    priority integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tenantId" integer NOT NULL,
    "integrationMode" text DEFAULT 'MANUAL'::text NOT NULL,
    "creditLimit" numeric(15,2),
    "approvalRules" jsonb
);


ALTER TABLE public."Funder" OWNER TO saas_user;

--
-- Name: Funder_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."Funder_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Funder_id_seq" OWNER TO saas_user;

--
-- Name: Funder_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."Funder_id_seq" OWNED BY public."Funder".id;


--
-- Name: Lead; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."Lead" (
    id integer NOT NULL,
    "orgId" integer NOT NULL,
    source text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    "idCard" text,
    "carBrand" text,
    "carModel" text,
    "loanAmount" numeric(15,2),
    remark text,
    status public."LeadStatus" DEFAULT 'PENDING_ASSIGN'::public."LeadStatus" NOT NULL,
    "assigneeId" integer,
    "nextFollowAt" timestamp(3) without time zone,
    "createdBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tenantId" integer NOT NULL
);


ALTER TABLE public."Lead" OWNER TO saas_user;

--
-- Name: LeadFollowUp; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."LeadFollowUp" (
    id integer NOT NULL,
    "leadId" integer NOT NULL,
    "followType" text NOT NULL,
    content text NOT NULL,
    "nextFollowAt" timestamp(3) without time zone,
    "createdBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."LeadFollowUp" OWNER TO saas_user;

--
-- Name: LeadFollowUp_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."LeadFollowUp_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."LeadFollowUp_id_seq" OWNER TO saas_user;

--
-- Name: LeadFollowUp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."LeadFollowUp_id_seq" OWNED BY public."LeadFollowUp".id;


--
-- Name: Lead_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."Lead_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Lead_id_seq" OWNER TO saas_user;

--
-- Name: Lead_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."Lead_id_seq" OWNED BY public."Lead".id;


--
-- Name: Menu; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."Menu" (
    id integer NOT NULL,
    "parentId" integer,
    path text NOT NULL,
    name text NOT NULL,
    component text DEFAULT ''::text NOT NULL,
    title text NOT NULL,
    icon text,
    sort integer DEFAULT 0 NOT NULL,
    "keepAlive" boolean DEFAULT false NOT NULL,
    hidden boolean DEFAULT false NOT NULL,
    "hiddenTab" boolean DEFAULT false NOT NULL,
    link text,
    iframe boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tenantId" integer NOT NULL
);


ALTER TABLE public."Menu" OWNER TO saas_user;

--
-- Name: Menu_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."Menu_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Menu_id_seq" OWNER TO saas_user;

--
-- Name: Menu_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."Menu_id_seq" OWNED BY public."Menu".id;


--
-- Name: OperationLog; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."OperationLog" (
    id integer NOT NULL,
    "orgId" integer,
    "userId" integer,
    "userName" text,
    module text NOT NULL,
    action text NOT NULL,
    description text,
    "requestData" jsonb,
    "responseData" jsonb,
    ip text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "tenantId" integer
);


ALTER TABLE public."OperationLog" OWNER TO saas_user;

--
-- Name: OperationLog_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."OperationLog_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."OperationLog_id_seq" OWNER TO saas_user;

--
-- Name: OperationLog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."OperationLog_id_seq" OWNED BY public."OperationLog".id;


--
-- Name: Organization; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."Organization" (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    "creditCode" text,
    "contactName" text,
    "contactPhone" text,
    address text,
    status public."OrgStatus" DEFAULT 'ACTIVE'::public."OrgStatus" NOT NULL,
    "packageType" text,
    "expireAt" timestamp(3) without time zone,
    "apiEnabled" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tenantId" integer NOT NULL
);


ALTER TABLE public."Organization" OWNER TO saas_user;

--
-- Name: Organization_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."Organization_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Organization_id_seq" OWNER TO saas_user;

--
-- Name: Organization_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."Organization_id_seq" OWNED BY public."Organization".id;


--
-- Name: Permission; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."Permission" (
    id integer NOT NULL,
    "menuId" integer NOT NULL,
    title text NOT NULL,
    "authMark" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tenantId" integer NOT NULL
);


ALTER TABLE public."Permission" OWNER TO saas_user;

--
-- Name: Permission_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."Permission_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Permission_id_seq" OWNER TO saas_user;

--
-- Name: Permission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."Permission_id_seq" OWNED BY public."Permission".id;


--
-- Name: Product; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."Product" (
    id integer NOT NULL,
    "orgId" integer NOT NULL,
    name text NOT NULL,
    "productType" text NOT NULL,
    "minRate" numeric(5,4) NOT NULL,
    "maxRate" numeric(5,4) NOT NULL,
    "minAmount" numeric(15,2) NOT NULL,
    "maxAmount" numeric(15,2) NOT NULL,
    "minTerm" integer NOT NULL,
    "maxTerm" integer NOT NULL,
    "repaymentMethod" text NOT NULL,
    "minAge" integer,
    "maxAge" integer,
    "maxCarAge" integer,
    "maxMileage" integer,
    "ltvLimit" numeric(5,4),
    "minDownPayment" numeric(5,4),
    regions text,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    "fileChecklist" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tenantId" integer NOT NULL,
    "applicableFunders" jsonb,
    "accessConditions" jsonb,
    "valuationDiscountRate" numeric(5,4)
);


ALTER TABLE public."Product" OWNER TO saas_user;

--
-- Name: Product_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."Product_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Product_id_seq" OWNER TO saas_user;

--
-- Name: Product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."Product_id_seq" OWNED BY public."Product".id;


--
-- Name: RepaymentPlan; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."RepaymentPlan" (
    id integer NOT NULL,
    "applicationId" integer NOT NULL,
    period integer NOT NULL,
    "dueDate" timestamp(3) without time zone NOT NULL,
    principal numeric(15,2) NOT NULL,
    interest numeric(15,2) NOT NULL,
    "totalAmount" numeric(15,2) NOT NULL,
    "paidPrincipal" numeric(15,2) DEFAULT 0 NOT NULL,
    "paidInterest" numeric(15,2) DEFAULT 0 NOT NULL,
    "paidTotal" numeric(15,2) DEFAULT 0 NOT NULL,
    status public."RepaymentStatus" DEFAULT 'NOT_DUE'::public."RepaymentStatus" NOT NULL,
    "overdueDays" integer DEFAULT 0 NOT NULL,
    "penaltyAmount" numeric(15,2) DEFAULT 0 NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tenantId" integer NOT NULL
);


ALTER TABLE public."RepaymentPlan" OWNER TO saas_user;

--
-- Name: RepaymentPlan_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."RepaymentPlan_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."RepaymentPlan_id_seq" OWNER TO saas_user;

--
-- Name: RepaymentPlan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."RepaymentPlan_id_seq" OWNED BY public."RepaymentPlan".id;


--
-- Name: RepaymentRecord; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."RepaymentRecord" (
    id integer NOT NULL,
    "planId" integer NOT NULL,
    amount numeric(15,2) NOT NULL,
    principal numeric(15,2) NOT NULL,
    interest numeric(15,2) NOT NULL,
    penalty numeric(15,2) DEFAULT 0 NOT NULL,
    "paymentMethod" text NOT NULL,
    "transactionNo" text,
    "voucherUrl" text,
    remark text,
    "createdBy" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "tenantId" integer NOT NULL
);


ALTER TABLE public."RepaymentRecord" OWNER TO saas_user;

--
-- Name: RepaymentRecord_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."RepaymentRecord_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."RepaymentRecord_id_seq" OWNER TO saas_user;

--
-- Name: RepaymentRecord_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."RepaymentRecord_id_seq" OWNED BY public."RepaymentRecord".id;


--
-- Name: Role; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."Role" (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tenantId" integer NOT NULL,
    "dataScope" text DEFAULT 'ALL'::text NOT NULL
);


ALTER TABLE public."Role" OWNER TO saas_user;

--
-- Name: RoleMenu; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."RoleMenu" (
    "roleId" integer NOT NULL,
    "menuId" integer NOT NULL
);


ALTER TABLE public."RoleMenu" OWNER TO saas_user;

--
-- Name: RolePermission; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."RolePermission" (
    "roleId" integer NOT NULL,
    "permissionId" integer NOT NULL
);


ALTER TABLE public."RolePermission" OWNER TO saas_user;

--
-- Name: Role_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."Role_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Role_id_seq" OWNER TO saas_user;

--
-- Name: Role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."Role_id_seq" OWNED BY public."Role".id;


--
-- Name: SignRecord; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."SignRecord" (
    id integer NOT NULL,
    "applicationId" integer NOT NULL,
    status public."SignStatus" DEFAULT 'PENDING'::public."SignStatus" NOT NULL,
    "contractUrl" text,
    "signedAt" timestamp(3) without time zone,
    "videoUrl" text,
    "expiredAt" timestamp(3) without time zone,
    "cancelledReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tenantId" integer NOT NULL
);


ALTER TABLE public."SignRecord" OWNER TO saas_user;

--
-- Name: SignRecord_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."SignRecord_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SignRecord_id_seq" OWNER TO saas_user;

--
-- Name: SignRecord_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."SignRecord_id_seq" OWNED BY public."SignRecord".id;


--
-- Name: Tenant; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."Tenant" (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Tenant" OWNER TO saas_user;

--
-- Name: Tenant_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."Tenant_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Tenant_id_seq" OWNER TO saas_user;

--
-- Name: Tenant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."Tenant_id_seq" OWNED BY public."Tenant".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    "userName" text NOT NULL,
    "passwordHash" text NOT NULL,
    "nickName" text NOT NULL,
    gender text DEFAULT '未知'::text NOT NULL,
    phone text,
    email text NOT NULL,
    avatar text,
    status public."UserStatus" DEFAULT 'ONLINE'::public."UserStatus" NOT NULL,
    "createdBy" text DEFAULT 'system'::text NOT NULL,
    "updatedBy" text DEFAULT 'system'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "tenantId" integer NOT NULL,
    "deptId" integer
);


ALTER TABLE public."User" OWNER TO saas_user;

--
-- Name: UserRole; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."UserRole" (
    "userId" integer NOT NULL,
    "roleId" integer NOT NULL
);


ALTER TABLE public."UserRole" OWNER TO saas_user;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_id_seq" OWNER TO saas_user;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: Vehicle; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public."Vehicle" (
    id integer NOT NULL,
    "customerId" integer NOT NULL,
    vin text,
    "plateNumber" text,
    brand text,
    model text,
    color text,
    year integer,
    mileage integer,
    "purchasePrice" numeric(15,2),
    "estimateValue" numeric(15,2),
    "isMortgaged" boolean DEFAULT false NOT NULL,
    "mortgageInfo" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "ownerName" text,
    address text,
    "usageNature" text,
    "sealInfo" text,
    "engineNumber" text,
    "registerDate" timestamp(3) without time zone,
    "vehicleImgUrl" text
);


ALTER TABLE public."Vehicle" OWNER TO saas_user;

--
-- Name: Vehicle_id_seq; Type: SEQUENCE; Schema: public; Owner: saas_user
--

CREATE SEQUENCE public."Vehicle_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Vehicle_id_seq" OWNER TO saas_user;

--
-- Name: Vehicle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: saas_user
--

ALTER SEQUENCE public."Vehicle_id_seq" OWNED BY public."Vehicle".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: saas_user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO saas_user;

--
-- Name: Application id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Application" ALTER COLUMN id SET DEFAULT nextval('public."Application_id_seq"'::regclass);


--
-- Name: ApplicationFile id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."ApplicationFile" ALTER COLUMN id SET DEFAULT nextval('public."ApplicationFile_id_seq"'::regclass);


--
-- Name: ApprovalRecord id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."ApprovalRecord" ALTER COLUMN id SET DEFAULT nextval('public."ApprovalRecord_id_seq"'::regclass);


--
-- Name: BankCard id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."BankCard" ALTER COLUMN id SET DEFAULT nextval('public."BankCard_id_seq"'::regclass);


--
-- Name: Customer id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Customer" ALTER COLUMN id SET DEFAULT nextval('public."Customer_id_seq"'::regclass);


--
-- Name: CustomerContact id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."CustomerContact" ALTER COLUMN id SET DEFAULT nextval('public."CustomerContact_id_seq"'::regclass);


--
-- Name: Department id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Department" ALTER COLUMN id SET DEFAULT nextval('public."Department_id_seq"'::regclass);


--
-- Name: DictData id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."DictData" ALTER COLUMN id SET DEFAULT nextval('public."DictData_id_seq"'::regclass);


--
-- Name: DictType id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."DictType" ALTER COLUMN id SET DEFAULT nextval('public."DictType_id_seq"'::regclass);


--
-- Name: Disbursement id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Disbursement" ALTER COLUMN id SET DEFAULT nextval('public."Disbursement_id_seq"'::regclass);


--
-- Name: FileAsset id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."FileAsset" ALTER COLUMN id SET DEFAULT nextval('public."FileAsset_id_seq"'::regclass);


--
-- Name: FlowConfig id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."FlowConfig" ALTER COLUMN id SET DEFAULT nextval('public."FlowConfig_id_seq"'::regclass);


--
-- Name: Funder id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Funder" ALTER COLUMN id SET DEFAULT nextval('public."Funder_id_seq"'::regclass);


--
-- Name: Lead id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Lead" ALTER COLUMN id SET DEFAULT nextval('public."Lead_id_seq"'::regclass);


--
-- Name: LeadFollowUp id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."LeadFollowUp" ALTER COLUMN id SET DEFAULT nextval('public."LeadFollowUp_id_seq"'::regclass);


--
-- Name: Menu id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Menu" ALTER COLUMN id SET DEFAULT nextval('public."Menu_id_seq"'::regclass);


--
-- Name: OperationLog id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."OperationLog" ALTER COLUMN id SET DEFAULT nextval('public."OperationLog_id_seq"'::regclass);


--
-- Name: Organization id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Organization" ALTER COLUMN id SET DEFAULT nextval('public."Organization_id_seq"'::regclass);


--
-- Name: Permission id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Permission" ALTER COLUMN id SET DEFAULT nextval('public."Permission_id_seq"'::regclass);


--
-- Name: Product id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Product" ALTER COLUMN id SET DEFAULT nextval('public."Product_id_seq"'::regclass);


--
-- Name: RepaymentPlan id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."RepaymentPlan" ALTER COLUMN id SET DEFAULT nextval('public."RepaymentPlan_id_seq"'::regclass);


--
-- Name: RepaymentRecord id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."RepaymentRecord" ALTER COLUMN id SET DEFAULT nextval('public."RepaymentRecord_id_seq"'::regclass);


--
-- Name: Role id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Role" ALTER COLUMN id SET DEFAULT nextval('public."Role_id_seq"'::regclass);


--
-- Name: SignRecord id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."SignRecord" ALTER COLUMN id SET DEFAULT nextval('public."SignRecord_id_seq"'::regclass);


--
-- Name: Tenant id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Tenant" ALTER COLUMN id SET DEFAULT nextval('public."Tenant_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Name: Vehicle id; Type: DEFAULT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Vehicle" ALTER COLUMN id SET DEFAULT nextval('public."Vehicle_id_seq"'::regclass);


--
-- Data for Name: Application; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."Application" (id, "orgId", "customerId", "productId", "funderId", "applicationNo", amount, term, rate, "repaymentMethod", purpose, status, "creatorId", "sourceLeadId", "supplementReason", "supplementDeadline", "approvedAmount", "approvedTerm", "approvedRate", remark, "createdAt", "updatedAt", "tenantId", "businessType", "currentNode", "currentStatus") FROM stdin;
1	1	1	1	1	SO20260613001	200000.00	24	0.0800	等额本息	车辆抵押贷款	SUBMITTED	3	\N	\N	\N	\N	\N	\N	\N	2026-06-13 17:36:42.141	2026-06-13 17:36:42.141	1	CAR_LOAN	1100	10
2	1	1	1	1	SO20260612003	150000.00	12	0.0600	等额本息	车辆抵押贷款	PENDING_RISK_PRE	3	\N	\N	\N	\N	\N	\N	\N	2026-06-12 17:36:42.141	2026-06-13 17:36:42.141	1	CAR_LOAN	1200	20
\.


--
-- Data for Name: ApplicationFile; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."ApplicationFile" (id, "applicationId", "fileType", "fileUrl", "fileName", "ocrResult", "isValid", "createdAt") FROM stdin;
\.


--
-- Data for Name: ApprovalRecord; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."ApprovalRecord" (id, "applicationId", "approverId", stage, action, opinion, amount, term, rate, "createdAt", "tenantId") FROM stdin;
\.


--
-- Data for Name: BankCard; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."BankCard" (id, "customerId", "bankName", "cardNo", "cardType", "isDefault", "createdAt") FROM stdin;
\.


--
-- Data for Name: Customer; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."Customer" (id, "orgId", name, phone, "idCard", gender, "birthDate", "maritalStatus", education, occupation, "companyName", "monthlyIncome", address, "emergencyName", "emergencyPhone", status, "createdAt", "updatedAt", "tenantId", nation, "householdAddress", "issuingAuthority", "idCardValidFrom", "idCardValidTo", "idCardFront", "idCardBack") FROM stdin;
1	1	张三	13800138001	\N	MALE	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACTIVE	2026-06-13 17:36:00.31	2026-06-13 17:36:00.31	1	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: CustomerContact; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."CustomerContact" (id, "customerId", name, relation, phone, address, "isEmergency", "createdAt") FROM stdin;
\.


--
-- Data for Name: Department; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."Department" (id, "orgId", "parentId", name, "managerId", sort, "createdAt", "updatedAt", "tenantId") FROM stdin;
\.


--
-- Data for Name: DictData; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."DictData" (id, "tenantId", "typeId", label, value, sort, status, remark, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DictType; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."DictType" (id, "tenantId", name, code, status, remark, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Disbursement; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."Disbursement" (id, "applicationId", status, "gpsDeviceNo", "gpsInstallImg", "gpsInstallAt", "mortgageStatus", "mortgageImg", "mortgageAt", "disburseAmount", "disburseAccount", "disburseAt", "transactionNo", "voucherUrl", remark, "createdAt", "updatedAt", "tenantId") FROM stdin;
\.


--
-- Data for Name: FileAsset; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."FileAsset" (id, "tenantId", "orgId", "businessType", "businessId", "categoryCode", "categoryName", "fileName", "fileUrl", "objectKey", "mimeType", "fileExt", "fileSize", "storageType", status, "uploadedBy", remark, "createdAt", "updatedAt") FROM stdin;
2	1	1	MOBILE	3	IMAGE	图片	file-1780493697455	/saas/api/uploads/images/202606/29ebf830-c500-461b-8a0a-823f00d0f901.jpg	images/202606/29ebf830-c500-461b-8a0a-823f00d0f901.jpg	image/jpeg	jpg	164048	LOCAL	ACTIVE	3	\N	2026-06-03 13:34:57.898	2026-06-03 13:34:57.898
17	1	1	MOBILE	3	IMAGE	图片	file-1780587626935	/saas/api/uploads/images/202606/dc673d32-420a-49c3-a13d-5e92223a3e64.jpg	images/202606/dc673d32-420a-49c3-a13d-5e92223a3e64.jpg	image/jpeg	jpg	162870	LOCAL	ACTIVE	3	\N	2026-06-04 15:40:27.683	2026-06-04 15:40:27.683
18	1	1	MOBILE	3	IMAGE	图片	file-1780587934312	/saas/api/uploads/images/202606/42803122-725e-4be1-980b-fe1cde11f847.jpg	images/202606/42803122-725e-4be1-980b-fe1cde11f847.jpg	image/jpeg	jpg	162870	LOCAL	ACTIVE	3	\N	2026-06-04 15:45:34.818	2026-06-04 15:45:34.818
19	1	\N	\N	\N	IMAGE	图片	banner-01.png	/saas/api/uploads/images/202606/1b010032-1dba-498b-ab1b-254659cc697a.png	images/202606/1b010032-1dba-498b-ab1b-254659cc697a.png	image/png	png	257829	LOCAL	ACTIVE	3	\N	2026-06-05 08:59:24.17	2026-06-05 08:59:24.17
\.


--
-- Data for Name: FlowConfig; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."FlowConfig" (id, "tenantId", "orgId", name, "businessType", "nodeCode", "nodeName", "approveLevel", "amountLimit", "timeoutHours", "requireMaterials", "requireApproval", "autoPass", "ruleConfig", status, remark, "createdAt", "updatedAt") FROM stdin;
1	1	1	预审进件-身份证信息	CAR_LOAN	1100	身份证信息	1	\N	\N	t	f	f	{"sort": 1100, "nodeCode": 1100, "parallel": false, "required": false, "phaseCode": 1000, "phaseName": "预审进件", "transitions": [{"action": 10, "toNode": 1200}], "initialStatus": 10}	ACTIVE	\N	2026-06-03 13:29:13.056	2026-06-03 13:48:16.344
2	1	1	预审进件-车辆信息	CAR_LOAN	1200	车辆信息	1	\N	\N	t	f	f	{"sort": 1200, "nodeCode": 1200, "parallel": false, "required": false, "phaseCode": 1000, "phaseName": "预审进件", "transitions": [{"action": 10, "toNode": 1300}], "initialStatus": 10}	ACTIVE	\N	2026-06-03 13:29:13.065	2026-06-03 13:48:16.352
3	1	1	预审进件-申请信息	CAR_LOAN	1300	申请信息	1	\N	\N	t	f	f	{"sort": 1300, "nodeCode": 1300, "parallel": false, "required": false, "phaseCode": 1000, "phaseName": "预审进件", "transitions": [{"action": 10, "toNode": 1400}], "initialStatus": 10}	ACTIVE	\N	2026-06-03 13:29:13.069	2026-06-03 13:48:16.356
4	1	1	预审进件-签署授权书	CAR_LOAN	1400	签署授权书	1	\N	\N	t	f	f	{"sort": 1400, "nodeCode": 1400, "parallel": false, "required": false, "phaseCode": 1000, "phaseName": "预审进件", "transitions": [{"action": 10, "toNode": 2000}], "initialStatus": 10}	ACTIVE	\N	2026-06-03 13:29:13.073	2026-06-03 13:48:16.36
5	1	1	风控模型预审-风控模型预审	CAR_LOAN	2000	风控模型预审	1	\N	\N	f	f	t	{"sort": 2000, "nodeCode": 2000, "parallel": false, "required": false, "phaseCode": 2000, "phaseName": "风控模型预审", "transitions": [{"action": 20, "toNode": 3000}], "initialStatus": 10}	ACTIVE	\N	2026-06-03 13:29:13.077	2026-06-03 13:48:16.366
6	1	1	资方预审-资方预审	CAR_LOAN	3000	资方预审	1	\N	\N	f	t	f	{"sort": 3000, "nodeCode": 3000, "parallel": false, "required": false, "phaseCode": 3000, "phaseName": "资方预审", "transitions": [{"action": 20, "toNode": 4000}], "initialStatus": 10}	ACTIVE	\N	2026-06-03 13:29:13.081	2026-06-03 13:48:16.371
7	1	1	资料补充-资料补充	CAR_LOAN	4000	资料补充	1	\N	\N	t	f	f	{"sort": 4000, "nodeCode": 4000, "parallel": false, "required": false, "phaseCode": 4000, "phaseName": "资料补充", "transitions": [{"action": 10, "toNode": 5000, "condition": "REQUIRED_TASKS_COMPLETED"}], "initialStatus": 10}	ACTIVE	\N	2026-06-03 13:29:13.085	2026-06-03 13:48:16.375
8	1	1	资料补充-客户资料	CAR_LOAN	4100	客户资料	1	\N	\N	t	f	f	{"sort": 4100, "nodeCode": 4100, "parallel": true, "required": true, "phaseCode": 4000, "phaseName": "资料补充", "parentNode": 4000, "transitions": [], "initialStatus": 0}	ACTIVE	\N	2026-06-03 13:29:13.089	2026-06-03 13:48:16.379
9	1	1	资料补充-车辆资料	CAR_LOAN	4200	车辆资料	1	\N	\N	t	f	f	{"sort": 4200, "nodeCode": 4200, "parallel": true, "required": true, "phaseCode": 4000, "phaseName": "资料补充", "parentNode": 4000, "transitions": [], "initialStatus": 0}	ACTIVE	\N	2026-06-03 13:29:13.092	2026-06-03 13:48:16.383
10	1	1	资料补充-订单信息	CAR_LOAN	4300	订单信息	1	\N	\N	t	f	f	{"sort": 4300, "nodeCode": 4300, "parallel": true, "required": true, "phaseCode": 4000, "phaseName": "资料补充", "parentNode": 4000, "transitions": [], "initialStatus": 0}	ACTIVE	\N	2026-06-03 13:29:13.096	2026-06-03 13:48:16.388
11	1	1	资料补充-文件信息	CAR_LOAN	4400	文件信息	1	\N	\N	t	f	f	{"sort": 4400, "nodeCode": 4400, "parallel": true, "required": true, "phaseCode": 4000, "phaseName": "资料补充", "parentNode": 4000, "transitions": [], "initialStatus": 0}	ACTIVE	\N	2026-06-03 13:29:13.099	2026-06-03 13:48:16.392
12	1	1	风控初审-风控初审	CAR_LOAN	5000	风控初审	1	\N	\N	f	t	f	{"sort": 5000, "nodeCode": 5000, "parallel": false, "required": false, "phaseCode": 5000, "phaseName": "风控初审", "transitions": [{"action": 20, "toNode": 6000}], "initialStatus": 10}	ACTIVE	\N	2026-06-03 13:29:13.103	2026-06-03 13:48:16.396
13	1	1	风控终审-风控终审	CAR_LOAN	6000	风控终审	2	\N	\N	f	t	f	{"sort": 6000, "nodeCode": 6000, "parallel": false, "required": false, "phaseCode": 6000, "phaseName": "风控终审", "transitions": [{"action": 20, "toNode": 7000}], "initialStatus": 10}	ACTIVE	\N	2026-06-03 13:29:13.106	2026-06-03 13:48:16.402
14	1	1	请款资料-请款资料	CAR_LOAN	7000	请款资料	1	\N	\N	t	f	f	{"sort": 7000, "nodeCode": 7000, "parallel": false, "required": false, "phaseCode": 7000, "phaseName": "请款资料", "transitions": [{"action": 10, "toNode": 8000}], "initialStatus": 10}	ACTIVE	\N	2026-06-03 13:29:13.11	2026-06-03 13:48:16.411
15	1	1	资方终审-资方终审	CAR_LOAN	8000	资方终审	1	\N	\N	f	t	f	{"sort": 8000, "nodeCode": 8000, "parallel": false, "required": false, "phaseCode": 8000, "phaseName": "资方终审", "transitions": [{"action": 20, "toNode": 9000}], "initialStatus": 10}	ACTIVE	\N	2026-06-03 13:29:13.114	2026-06-03 13:48:16.415
16	1	1	资方放款-资方放款	CAR_LOAN	9000	资方放款	1	\N	\N	f	f	f	{"sort": 9000, "nodeCode": 9000, "parallel": false, "required": false, "phaseCode": 9000, "phaseName": "资方放款", "transitions": [], "initialStatus": 10}	ACTIVE	\N	2026-06-03 13:29:13.118	2026-06-03 13:48:16.419
34	1	1	结束	PAWN	2	结束	1	\N	\N	f	t	f	{"sort": 2, "nodeCode": 2, "parallel": false, "required": false, "phaseCode": 2, "phaseName": "结束", "transitions": [], "initialStatus": 10}	ACTIVE	\N	2026-06-03 13:49:27.692	2026-06-03 13:49:27.692
33	1	1	开始	PAWN	1	开始	1	\N	\N	f	t	f	{"sort": 1, "nodeCode": 1, "parallel": false, "required": false, "phaseCode": 1, "phaseName": "1", "transitions": [], "initialStatus": 10}	ACTIVE	\N	2026-06-03 13:49:05.38	2026-06-03 13:50:15.558
\.


--
-- Data for Name: Funder; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."Funder" (id, "orgId", name, code, "funderType", "contactName", "contactPhone", "apiConfig", priority, status, "createdAt", "updatedAt", "tenantId", "integrationMode", "creditLimit", "approvalRules") FROM stdin;
1	1	平安银行	PABANK	BANK	\N	\N	\N	10	ACTIVE	2026-06-13 17:35:35.464	2026-06-13 17:35:35.464	1	MANUAL	\N	\N
\.


--
-- Data for Name: Lead; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."Lead" (id, "orgId", source, name, phone, "idCard", "carBrand", "carModel", "loanAmount", remark, status, "assigneeId", "nextFollowAt", "createdBy", "createdAt", "updatedAt", "tenantId") FROM stdin;
1	1	SELF	张三	13800138001	\N	宝马	3系	200000.00	\N	CONVERTED	\N	\N	\N	2026-06-13 17:35:41.735	2026-06-13 17:35:41.735	1
\.


--
-- Data for Name: LeadFollowUp; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."LeadFollowUp" (id, "leadId", "followType", content, "nextFollowAt", "createdBy", "createdAt") FROM stdin;
\.


--
-- Data for Name: Menu; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."Menu" (id, "parentId", path, name, component, title, icon, sort, "keepAlive", hidden, "hiddenTab", link, iframe, "createdAt", "updatedAt", "tenantId") FROM stdin;
14	12	package-billing	PackageBilling	/business/common-list	套餐与计费	ri:money-dollar-circle-line	22	t	f	f	\N	f	2026-06-01 09:43:04.106	2026-06-01 12:00:48.544	1
15	12	product-template	ProductTemplate	/business/common-list	产品与资方模板	ri:file-copy-line	23	t	f	f	\N	f	2026-06-01 09:43:04.11	2026-06-01 12:00:48.548	1
16	12	supervision	PlatformSupervision	/business/common-list	平台业务监管	ri:eye-line	24	t	f	f	\N	f	2026-06-01 09:43:04.115	2026-06-01 12:00:48.552	1
17	12	third-party	ThirdPartyService	/business/common-list	第三方服务管理	ri:plug-line	25	t	f	f	\N	f	2026-06-01 09:43:04.119	2026-06-01 12:00:48.556	1
18	12	work-order	WorkOrder	/business/common-list	运营工单中心	ri:customer-service-2-line	26	t	f	f	\N	f	2026-06-01 09:43:04.123	2026-06-01 12:00:48.56	1
4	\N	/system	System	/index/index	系统管理	ri:settings-3-line	40	f	f	f	\N	f	2026-05-27 01:11:44.538	2026-06-01 12:00:48.575	1
39	33	lead	Lead	/business/common-list	线索管理	ri:customer-service-line	66	t	t	f	\N	f	2026-06-01 09:43:04.211	2026-06-01 12:00:48.638	1
26	4	dict	DictMgmt	/system/dict	字典管理	ri:book-open-line	44	t	f	f	\N	f	2026-06-01 09:43:04.159	2026-06-01 12:00:48.59	1
40	33	customer	Customer	/business/common-list	客户管理	ri:contacts-line	67	t	t	f	\N	f	2026-06-01 09:43:04.214	2026-06-01 12:00:48.642	1
27	4	region	RegionMgmt	/business/common-list	地区管理	ri:map-pin-line	45	t	f	f	\N	f	2026-06-01 09:43:04.163	2026-06-01 12:00:48.593	1
5	4	user	User	/system/user	用户管理	ri:user-line	41	t	f	f	\N	f	2026-05-27 01:11:44.541	2026-06-02 13:34:12.209	1
33	\N	/business	Business	/index/index	业务管理	ri:briefcase-line	60	f	f	f	\N	f	2026-06-01 09:43:04.186	2026-06-01 12:00:48.616	1
38	12	flow-config	FlowConfig	/business/flow-config	流程与规则	ri:git-branch-line	71	t	f	f	\N	f	2026-06-01 09:43:04.207	2026-06-05 09:33:11.47	1
34	12	org	Org	/business/common-list	机构管理	ri:building-line	67	t	f	f	\N	f	2026-06-01 09:43:04.191	2026-06-05 09:33:11.47	1
35	12	dept	Dept	/business/common-list	部门管理	ri:organization-chart	68	t	f	f	\N	f	2026-06-01 09:43:04.194	2026-06-05 09:33:11.47	1
36	12	product	Product	/business/common-list	产品配置	ri:file-list-line	69	t	f	f	\N	f	2026-06-01 09:43:04.199	2026-06-05 09:33:11.47	1
37	12	funder	Funder	/business/common-list	资方配置	ri:bank-line	70	t	f	f	\N	f	2026-06-01 09:43:04.203	2026-06-05 09:33:11.47	1
20	19	stats	DataStats	/data-center/stats	数据统计	ri:bar-chart-line	31	t	f	f	\N	f	2026-06-01 09:43:04.133	2026-06-05 09:33:11.498	1
21	19	audit-log	AuditLog	/data-center/audit-log	日志审计	ri:file-list-3-line	32	t	f	f	\N	f	2026-06-01 09:43:04.138	2026-06-05 09:33:11.498	1
30	4	sys-param	SysParam	/business/common-list	系统参数	ri:settings-line	49	t	f	f	\N	f	2026-06-01 09:43:04.175	2026-06-02 13:34:12.196	1
31	4	notice	Notice	/business/common-list	公告管理	ri:notification-line	50	t	f	f	\N	f	2026-06-01 09:43:04.178	2026-06-02 13:34:12.196	1
8	4	user-center	UserCenter	/business/common-list	用户中心	ri:user-line	51	t	t	t	\N	f	2026-05-29 02:37:47.634	2026-06-02 13:34:12.196	1
29	4	msg-template	MsgTemplate	/business/common-list	消息模板	ri:mail-send-line	48	t	f	f	\N	f	2026-06-01 09:43:04.171	2026-06-02 13:34:12.196	1
28	4	file-config	FileConfig	/system/file-config	文件存储配置	ri:hard-drive-2-line	47	t	f	f	\N	f	2026-06-01 09:43:04.167	2026-06-02 13:34:12.196	1
6	4	role	Role	/system/role	角色管理	ri:user-settings-line	42	t	f	f	\N	f	2026-05-27 01:11:44.545	2026-06-02 13:34:12.209	1
7	4	menu	Menus	/system/menu	菜单管理	ri:menu-line	43	t	f	f	\N	f	2026-05-27 01:11:44.548	2026-06-02 13:34:12.209	1
41	33	application	Application	/business/common-list	进件管理	ri:file-edit-line	68	t	t	f	\N	f	2026-06-01 09:43:04.219	2026-06-01 12:00:48.646	1
1	\N	/dashboard	Dashboard	/index/index	仪表盘	ri:dashboard-line	10	f	f	f	\N	f	2026-05-27 01:11:44.525	2026-06-01 12:00:48.523	1
2	1	console	Console	/dashboard/console	工作台	ri:computer-line	11	t	f	f	\N	f	2026-05-27 01:11:44.53	2026-06-01 12:00:48.528	1
3	1	analysis	Analysis	/dashboard/analysis	分析页	ri:line-chart-line	12	t	f	f	\N	f	2026-05-27 01:11:44.534	2026-06-01 12:00:48.532	1
12	\N	/platform	Platform	/index/index	平台管理	ri:global-line	20	f	f	f	\N	f	2026-06-01 09:43:04.097	2026-06-01 12:00:48.535	1
13	12	tenant	TenantMgmt	/business/common-list	租户机构管理	ri:building-2-line	21	t	f	f	\N	f	2026-06-01 09:43:04.101	2026-06-01 12:00:48.54	1
19	\N	/datacenter	DataCenter	/index/index	数据中心	ri:bar-chart-box-line	30	f	f	f	\N	f	2026-06-01 09:43:04.129	2026-06-01 12:00:48.563	1
42	33	approval	Approval	/business/common-list	审批管理	ri:shield-check-line	69	t	t	f	\N	f	2026-06-01 09:43:04.223	2026-06-01 12:00:48.649	1
43	33	signing	Signing	/business/common-list	签约管理	ri:pen-nib-line	70	t	t	f	\N	f	2026-06-01 09:43:04.227	2026-06-01 12:00:48.653	1
44	33	disbursement	Disbursement	/business/common-list	放款管理	ri:money-cny-circle-line	71	t	t	f	\N	f	2026-06-01 09:43:04.231	2026-06-01 12:00:48.657	1
45	33	order	OrderMgmt	/business/common-list	订单管理	ri:file-list-2-line	72	t	t	f	\N	f	2026-06-01 09:43:04.235	2026-06-01 12:00:48.661	1
132	4	file	FileManage	/system/file	文件管理	ri:file-list-3-line	46	t	f	f	\N	f	2026-06-02 13:34:12.196	2026-06-02 13:34:12.196	1
46	33	repayment	Repayment	/business/common-list	还款管理	ri:refund-line	73	t	t	f	\N	f	2026-06-01 09:43:04.239	2026-06-01 12:00:48.665	1
47	33	pawn	PawnBusiness	/business/common-list	典当业务	ri:swap-box-line	74	t	t	f	\N	f	2026-06-01 09:43:04.244	2026-06-01 12:00:48.668	1
48	33	reports	Reports	/business/common-list	报表统计	ri:pie-chart-line	75	t	t	f	\N	f	2026-06-01 09:43:04.248	2026-06-01 12:00:48.672	1
133	33	precheck	BusinessPrecheck	/business/common-list	预审阶段	ri:file-search-line	61	t	f	f	\N	f	2026-06-05 09:33:11.455	2026-06-05 09:33:11.455	1
134	33	supplement	BusinessSupplement	/business/common-list	补件阶段	ri:folder-upload-line	62	t	f	f	\N	f	2026-06-05 09:33:11.455	2026-06-05 09:33:11.455	1
135	33	risk-approval	BusinessRiskApproval	/business/common-list	风控审批	ri:shield-check-line	63	t	f	f	\N	f	2026-06-05 09:33:11.455	2026-06-05 09:33:11.455	1
136	33	funder-final	BusinessFunderFinal	/business/common-list	资方终审	ri:bank-line	64	t	f	f	\N	f	2026-06-05 09:33:11.455	2026-06-05 09:33:11.455	1
137	33	signing	BusinessSigning	/business/common-list	客户签约	ri:contract-line	65	t	f	f	\N	f	2026-06-05 09:33:11.455	2026-06-05 09:33:11.455	1
138	33	disbursement	BusinessDisbursement	/business/common-list	请款放款	ri:money-cny-circle-line	66	t	f	f	\N	f	2026-06-05 09:33:11.455	2026-06-05 09:33:11.455	1
49	12	org-config	OrgConfig	/business/common-list	机构配置	ri:tools-line	72	t	t	t	\N	f	2026-06-01 09:43:04.252	2026-06-05 09:33:11.481	1
\.


--
-- Data for Name: OperationLog; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."OperationLog" (id, "orgId", "userId", "userName", module, action, description, "requestData", "responseData", ip, "userAgent", "createdAt", "tenantId") FROM stdin;
1	\N	\N	\N	auth	POST	POST /saas/api/auth/login 200 423ms	{"body": {"password": "***", "userName": "Super"}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"token": "***", "refreshToken": "***"}}	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.73(0x18004939) NetType/WIFI Language/zh_CN	2026-06-05 11:21:30.501	\N
2	\N	3	Super	user	GET	GET /saas/api/user/info 200 10ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"email": "super@example.com", "roles": ["R_SUPER"], "avatar": null, "userId": 3, "buttons": ["add"], "userName": "Super"}}	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.73(0x18004939) NetType/WIFI Language/zh_CN	2026-06-05 11:21:30.654	\N
3	\N	3	Super	v3	GET	GET /saas/api/v3/system/menus 200 32ms	{"body": {}, "query": {}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":[{\\"id\\":1,\\"parentId\\":null,\\"path\\":\\"/dashboard\\",\\"name\\":\\"Dashboard\\",\\"component\\":\\"/index/index\\",\\"meta\\":{\\"title\\":\\"仪表盘\\",\\"icon\\":\\"ri:dashboard-line\\",\\"sort\\":10,\\"keepAlive\\":false,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]},\\"children\\":[{\\"id\\":2,\\"parentId\\":1,\\"path\\":\\"console\\",\\"name\\":\\"Console\\",\\"component\\":\\"/dashboard/console\\",\\"meta\\":{\\"title\\":\\"工作台\\",\\"icon\\":\\"ri:computer-line\\",\\"sort\\":11,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]}},{\\"id\\":3,\\"parentId\\":1,\\"path\\":\\"analysis\\",\\"name\\":\\"Analysis\\",\\"component\\":\\"/dashboard/analysis\\",\\"meta\\":{\\"title\\":\\"分析页\\",\\"icon\\":\\"ri:line-chart-line\\",\\"sort\\":12,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]}}]},{\\"id\\":12,\\"parentId\\":null,\\"path\\":\\"/platform\\",\\"name\\":\\"Platform\\",\\"component\\":\\"/index/index\\",\\"meta\\":{\\"title\\":\\"平台管理\\",\\"icon\\":\\"ri:global-line\\",\\"sort\\":20,\\"keepAlive\\":false,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\"],\\"authList\\":[]},\\"children\\":[{\\"id\\":13,\\"parentId\\":12,\\"path\\":\\"tenant\\",\\"name\\":\\"TenantMgmt\\",\\"component\\":\\"/business/common-list\\",\\"meta\\":{\\"title\\":\\"租户机构管理\\",\\"icon\\":\\"ri:building-2-line\\",\\"sort\\":21,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\"],\\"authList\\":[{\\"id\\":4,\\"title\\":\\"Add\\",\\"authMark\\":\\"add\\",\\"roles\\":[]},{\\"id\\":5,\\"title\\":\\"Edit\\",\\"authMark\\":\\"edit\\",\\"roles\\":[]},{\\"id\\":6,\\"title\\":\\"Delete\\",\\"authMark\\":\\"delete\\",\\"roles\\":[]}]}},{\\"id\\":14,\\"parentId\\":12,\\"path\\":\\"package-billing\\",\\"name\\":\\"PackageBilling\\",\\"component\\":\\"", "truncated": true}	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.73(0x18004939) NetType/WIFI Language/zh_CN	2026-06-05 11:21:31.036	\N
4	\N	\N	\N	auth	POST	POST /saas/api/auth/login 200 207ms	{"body": {"password": "***", "userName": "Super"}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"token": "***", "refreshToken": "***"}}	172.18.0.1	Mozilla/5.0 (Linux; Android 16; V2419A Build/BP2A.250605.031.A3_V000L1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.178 Mobile Safari/537.36 XWEB/1460205 MMWEBSDK/20260502 MMWEBID/51 REV/67359f4ed01be2f482ec1f36b7b0474c71acc749 MicroMessenger/8.0.74.3120(0x28004A36) WeChat/arm64 Weixin NetType/5G Language/zh_CN ABI/arm64	2026-06-13 15:19:44.549	\N
5	\N	3	Super	user	GET	GET /saas/api/user/info 200 12ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"email": "super@example.com", "roles": ["R_SUPER"], "avatar": null, "userId": 3, "buttons": ["add"], "userName": "Super"}}	172.18.0.1	Mozilla/5.0 (Linux; Android 16; V2419A Build/BP2A.250605.031.A3_V000L1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.178 Mobile Safari/537.36 XWEB/1460205 MMWEBSDK/20260502 MMWEBID/51 REV/67359f4ed01be2f482ec1f36b7b0474c71acc749 MicroMessenger/8.0.74.3120(0x28004A36) WeChat/arm64 Weixin NetType/5G Language/zh_CN ABI/arm64	2026-06-13 15:19:44.616	\N
6	\N	3	Super	m	GET	GET /saas/api/m/statistics/overview 200 0ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	172.18.0.1	Mozilla/5.0 (Linux; Android 16; V2419A Build/BP2A.250605.031.A3_V000L1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.178 Mobile Safari/537.36 XWEB/1460205 MMWEBSDK/20260502 MMWEBID/51 REV/67359f4ed01be2f482ec1f36b7b0474c71acc749 MicroMessenger/8.0.74.3120(0x28004A36) WeChat/arm64 Weixin NetType/5G Language/zh_CN ABI/arm64	2026-06-13 15:19:45.258	\N
7	\N	3	Super	application	GET	GET /saas/api/application/order-list?pageNum=1&pageSize=10 200 35ms	{"body": {}, "query": {"pageNum": "1", "pageSize": "10"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 10, "total": 0, "current": 1, "records": []}}	172.18.0.1	Mozilla/5.0 (Linux; Android 16; V2419A Build/BP2A.250605.031.A3_V000L1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.178 Mobile Safari/537.36 XWEB/1460205 MMWEBSDK/20260502 MMWEBID/51 REV/67359f4ed01be2f482ec1f36b7b0474c71acc749 MicroMessenger/8.0.74.3120(0x28004A36) WeChat/arm64 Weixin NetType/5G Language/zh_CN ABI/arm64	2026-06-13 15:19:49.275	\N
8	\N	3	Super	m	GET	GET /saas/api/m/statistics/overview 200 0ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	172.18.0.1	Mozilla/5.0 (Linux; Android 16; V2419A Build/BP2A.250605.031.A3_V000L1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.178 Mobile Safari/537.36 XWEB/1460205 MMWEBSDK/20260502 MMWEBID/51 REV/67359f4ed01be2f482ec1f36b7b0474c71acc749 MicroMessenger/8.0.74.3120(0x28004A36) WeChat/arm64 Weixin NetType/5G Language/zh_CN ABI/arm64	2026-06-13 15:19:53.287	\N
9	\N	3	Super	m	GET	GET /saas/api/m/credit/getCreditDetailByOrderId/SO20260613001 404 8ms	{"body": {}, "query": {}, "params": {"creditOrderId": "SO20260613001"}}	{"error": "Not Found", "message": "授信申请不存在", "statusCode": 404}	172.18.0.1	Mozilla/5.0 (Linux; Android 16; V2419A Build/BP2A.250605.031.A3_V000L1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.178 Mobile Safari/537.36 XWEB/1460205 MMWEBSDK/20260502 MMWEBID/51 REV/67359f4ed01be2f482ec1f36b7b0474c71acc749 MicroMessenger/8.0.74.3120(0x28004A36) WeChat/arm64 Weixin NetType/5G Language/zh_CN ABI/arm64	2026-06-13 15:20:03.515	\N
10	\N	3	Super	m	GET	GET /saas/api/m/credit/getCreditDetailByOrderId/SO20260612003 404 5ms	{"body": {}, "query": {}, "params": {"creditOrderId": "SO20260612003"}}	{"error": "Not Found", "message": "授信申请不存在", "statusCode": 404}	172.18.0.1	Mozilla/5.0 (Linux; Android 16; V2419A Build/BP2A.250605.031.A3_V000L1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.178 Mobile Safari/537.36 XWEB/1460205 MMWEBSDK/20260502 MMWEBID/51 REV/67359f4ed01be2f482ec1f36b7b0474c71acc749 MicroMessenger/8.0.74.3120(0x28004A36) WeChat/arm64 Weixin NetType/5G Language/zh_CN ABI/arm64	2026-06-13 15:20:09.281	\N
11	\N	\N	\N	auth	POST	POST /saas/api/auth/login 200 200ms	{"body": {"password": "***", "userName": "Super"}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"token": "***", "refreshToken": "***"}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 17:42:08.903	\N
12	\N	3	Super	user	GET	GET /saas/api/user/info 200 11ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"email": "super@example.com", "roles": ["R_SUPER"], "avatar": null, "userId": 3, "buttons": ["add"], "userName": "Super"}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 17:42:08.951	\N
13	\N	3	Super	m	GET	GET /saas/api/m/statistics/overview 200 1ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 17:42:09.54	\N
14	\N	3	Super	application	GET	GET /saas/api/application/order-list?pageNum=1&pageSize=10 200 49ms	{"body": {}, "query": {"pageNum": "1", "pageSize": "10"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"瞬力矩阵\\",\\"customerId\\":1,\\"uuid\\":\\"1\\",\\"customerName\\":\\"张三\\",\\"personName\\":\\"张三\\",\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"telephone\\":\\"13800138001\\",\\"idCard\\":\\"\\",\\"vehicleId\\":1,\\"plateNumber\\":\\"京A12345\\",\\"vehicleBrand\\":\\"宝马\\",\\"vehicleModel\\":\\"3系\\",\\"vehicleOwner\\":\\"\\",\\"applicationNo\\":\\"SO20260612003\\",\\"orderNo\\":\\"SO20260612003\\",\\"creditOrderId\\":\\"SO20260612003\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[150000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[600000]},\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"status\\":\\"PENDING_RISK_PRE\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1200,\\"nodeCode\\":1200,\\"currentNodeName\\":\\"车辆信息\\",\\"nodeName\\":\\"车辆信息\\",\\"currentStatus\\":20,\\"nodeStatus\\":20,\\"currentStatusName\\":\\"已通过\\",\\"nodeStatusName\\":\\"已通过\\",\\"phaseCode\\":1000,\\"phaseName\\":\\"预审进件\\",\\"productId\\":1,\\"productName\\":\\"车抵贷\\",\\"funderId\\":1,\\"funderName\\":\\"平安银行\\",\\"creatorId\\":3,\\"creatorName\\":\\"Super Admin\\",\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}},{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"瞬力矩阵\\",\\"customerId\\":1,\\"uuid\\":\\"1\\",\\"customerName\\":\\"张三\\",\\"personName\\":\\"张三\\",\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"telephone\\":\\"13800138001\\",\\"idCard\\":\\"\\",\\"vehicleId\\":1,\\"plateNumber\\":\\"京A12345\\",\\"vehicleBrand\\":\\"宝马\\",\\"vehicleModel\\":\\"3系\\",\\"vehicleOwner\\":\\"\\",\\"applicationNo\\":\\"SO20260613001\\",\\"orderNo\\":\\"SO20260613001\\",\\"creditOrderId\\":\\"SO20260613001\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[200000]},\\"term\\":24,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[800000]},\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1100,\\"nodeCode\\":1100,\\"currentNodeName\\":\\"身份证信息\\",\\"nodeName\\":\\"身份证信息\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":1000,\\"phaseName\\":\\"预审进件\\",\\"productId\\":1,\\"productName\\":\\"车抵贷\\",\\"funderId\\":1,\\"funderName\\":\\"平安银行\\",\\"creatorId\\":3,\\"creatorName\\":\\"Super Admin\\",\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}}],\\"current\\":1,\\"size\\":", "truncated": true}	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-13 17:42:18.782	\N
15	\N	3	Super	m	GET	GET /saas/api/m/credit/getCreditDetailByOrderId/SO20260612003 200 9ms	{"body": {}, "query": {}, "params": {"creditOrderId": "SO20260612003"}}	{"msg": "success", "code": 200, "data": {"id": 2, "name": "张三", "uuid": "1", "phone": "13800138001", "remark": null, "status": 4, "periods": 12, "vehicle": {"id": 1, "uuid": "1", "address": null, "mileage": 50000, "sealInfo": null, "isMortgage": 2, "plateNumber": "京A12345", "usageNature": null, "vehicleCode": "WBAPA21070AL12345", "engineNumber": "B48B20A", "registerDate": "", "vehicleBrand": "宝马", "vehicleColor": "白色", "vehicleModel": "3系", "vehicleOwner": null, "purchasePrice": 35000000, "vehicleImgUrl": ""}, "customer": {"id": 1, "race": null, "uuid": "1", "gender": 1, "nation": null, "telephone": "13800138001", "idcardBack": "", "personName": "张三", "updateTime": "2026-06-13 17:36:00", "idcardFront": "", "personIdcard": null, "personAddress": null, "personValidDateEnd": null, "personValidDateStart": null, "personIssuingAuthority": null}, "pushQuota": "150000.00", "createTime": "2026-06-12 17:36:42", "updateTime": "2026-06-13 17:36:42", "productName": "车抵贷", "businessNode": "PRE_AUDIT", "creditOrderId": "SO20260612003"}}	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-13 17:42:20.768	\N
16	\N	3	Super	m	GET	GET /saas/api/m/credit/getCreditDetailByOrderId/SO20260613001 200 8ms	{"body": {}, "query": {}, "params": {"creditOrderId": "SO20260613001"}}	{"msg": "success", "code": 200, "data": {"id": 1, "name": "张三", "uuid": "1", "phone": "13800138001", "remark": null, "status": 4, "periods": 24, "vehicle": {"id": 1, "uuid": "1", "address": null, "mileage": 50000, "sealInfo": null, "isMortgage": 2, "plateNumber": "京A12345", "usageNature": null, "vehicleCode": "WBAPA21070AL12345", "engineNumber": "B48B20A", "registerDate": "", "vehicleBrand": "宝马", "vehicleColor": "白色", "vehicleModel": "3系", "vehicleOwner": null, "purchasePrice": 35000000, "vehicleImgUrl": ""}, "customer": {"id": 1, "race": null, "uuid": "1", "gender": 1, "nation": null, "telephone": "13800138001", "idcardBack": "", "personName": "张三", "updateTime": "2026-06-13 17:36:00", "idcardFront": "", "personIdcard": null, "personAddress": null, "personValidDateEnd": null, "personValidDateStart": null, "personIssuingAuthority": null}, "pushQuota": "200000.00", "createTime": "2026-06-13 17:36:42", "updateTime": "2026-06-13 17:36:42", "productName": "车抵贷", "businessNode": "PRE_AUDIT", "creditOrderId": "SO20260613001"}}	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-13 17:42:26.693	\N
17	\N	3	Super	m	GET	GET /saas/api/m/statistics/overview 200 0ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-13 17:42:33.738	\N
18	\N	3	Super	m	GET	GET /saas/api/m/credit/getCreditDetailByOrderId/SO20260613001 200 8ms	{"body": {}, "query": {}, "params": {"creditOrderId": "SO20260613001"}}	{"msg": "success", "code": 200, "data": {"id": 1, "name": "张三", "uuid": "1", "phone": "13800138001", "remark": null, "status": 4, "periods": 24, "vehicle": {"id": 1, "uuid": "1", "address": null, "mileage": 50000, "sealInfo": null, "isMortgage": 2, "plateNumber": "京A12345", "usageNature": null, "vehicleCode": "WBAPA21070AL12345", "engineNumber": "B48B20A", "registerDate": "", "vehicleBrand": "宝马", "vehicleColor": "白色", "vehicleModel": "3系", "vehicleOwner": null, "purchasePrice": 35000000, "vehicleImgUrl": ""}, "customer": {"id": 1, "race": null, "uuid": "1", "gender": 1, "nation": null, "telephone": "13800138001", "idcardBack": "", "personName": "张三", "updateTime": "2026-06-13 17:36:00", "idcardFront": "", "personIdcard": null, "personAddress": null, "personValidDateEnd": null, "personValidDateStart": null, "personIssuingAuthority": null}, "pushQuota": "200000.00", "createTime": "2026-06-13 17:36:42", "updateTime": "2026-06-13 17:36:42", "productName": "车抵贷", "businessNode": "PRE_AUDIT", "creditOrderId": "SO20260613001"}}	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-13 17:42:42.564	\N
33	\N	3	Super	user	GET	GET /saas/api/user/info 200 11ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"email": "super@example.com", "roles": ["R_SUPER"], "avatar": null, "userId": 3, "buttons": ["add"], "userName": "Super"}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 17:51:15.37	\N
19	\N	3	Super	m	GET	GET /saas/api/m/credit/getCreditDetailByOrderId/SO20260613001 200 10ms	{"body": {}, "query": {}, "params": {"creditOrderId": "SO20260613001"}}	{"msg": "success", "code": 200, "data": {"id": 1, "name": "张三", "uuid": "1", "phone": "13800138001", "remark": null, "status": 4, "periods": 24, "vehicle": {"id": 1, "uuid": "1", "address": null, "mileage": 50000, "sealInfo": null, "isMortgage": 2, "plateNumber": "京A12345", "usageNature": null, "vehicleCode": "WBAPA21070AL12345", "engineNumber": "B48B20A", "registerDate": "", "vehicleBrand": "宝马", "vehicleColor": "白色", "vehicleModel": "3系", "vehicleOwner": null, "purchasePrice": 35000000, "vehicleImgUrl": ""}, "customer": {"id": 1, "race": null, "uuid": "1", "gender": 1, "nation": null, "telephone": "13800138001", "idcardBack": "", "personName": "张三", "updateTime": "2026-06-13 17:36:00", "idcardFront": "", "personIdcard": null, "personAddress": null, "personValidDateEnd": null, "personValidDateStart": null, "personIssuingAuthority": null}, "pushQuota": "200000.00", "createTime": "2026-06-13 17:36:42", "updateTime": "2026-06-13 17:36:42", "productName": "车抵贷", "businessNode": "PRE_AUDIT", "creditOrderId": "SO20260613001"}}	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-13 17:42:52.652	\N
20	\N	3	Super	application	GET	GET /saas/api/application/order-list?pageNum=1&pageSize=10 200 37ms	{"body": {}, "query": {"pageNum": "1", "pageSize": "10"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"瞬力矩阵\\",\\"customerId\\":1,\\"uuid\\":\\"1\\",\\"customerName\\":\\"张三\\",\\"personName\\":\\"张三\\",\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"telephone\\":\\"13800138001\\",\\"idCard\\":\\"\\",\\"vehicleId\\":1,\\"plateNumber\\":\\"京A12345\\",\\"vehicleBrand\\":\\"宝马\\",\\"vehicleModel\\":\\"3系\\",\\"vehicleOwner\\":\\"\\",\\"applicationNo\\":\\"SO20260612003\\",\\"orderNo\\":\\"SO20260612003\\",\\"creditOrderId\\":\\"SO20260612003\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[150000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[600000]},\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"status\\":\\"PENDING_RISK_PRE\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1200,\\"nodeCode\\":1200,\\"currentNodeName\\":\\"车辆信息\\",\\"nodeName\\":\\"车辆信息\\",\\"currentStatus\\":20,\\"nodeStatus\\":20,\\"currentStatusName\\":\\"已通过\\",\\"nodeStatusName\\":\\"已通过\\",\\"phaseCode\\":1000,\\"phaseName\\":\\"预审进件\\",\\"productId\\":1,\\"productName\\":\\"车抵贷\\",\\"funderId\\":1,\\"funderName\\":\\"平安银行\\",\\"creatorId\\":3,\\"creatorName\\":\\"Super Admin\\",\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}},{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"瞬力矩阵\\",\\"customerId\\":1,\\"uuid\\":\\"1\\",\\"customerName\\":\\"张三\\",\\"personName\\":\\"张三\\",\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"telephone\\":\\"13800138001\\",\\"idCard\\":\\"\\",\\"vehicleId\\":1,\\"plateNumber\\":\\"京A12345\\",\\"vehicleBrand\\":\\"宝马\\",\\"vehicleModel\\":\\"3系\\",\\"vehicleOwner\\":\\"\\",\\"applicationNo\\":\\"SO20260613001\\",\\"orderNo\\":\\"SO20260613001\\",\\"creditOrderId\\":\\"SO20260613001\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[200000]},\\"term\\":24,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[800000]},\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1100,\\"nodeCode\\":1100,\\"currentNodeName\\":\\"身份证信息\\",\\"nodeName\\":\\"身份证信息\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":1000,\\"phaseName\\":\\"预审进件\\",\\"productId\\":1,\\"productName\\":\\"车抵贷\\",\\"funderId\\":1,\\"funderName\\":\\"平安银行\\",\\"creatorId\\":3,\\"creatorName\\":\\"Super Admin\\",\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}}],\\"current\\":1,\\"size\\":", "truncated": true}	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-13 17:43:01.747	\N
21	\N	3	Super	m	GET	GET /saas/api/m/credit/getCreditDetailByOrderId/SO20260613001 200 7ms	{"body": {}, "query": {}, "params": {"creditOrderId": "SO20260613001"}}	{"msg": "success", "code": 200, "data": {"id": 1, "name": "张三", "uuid": "1", "phone": "13800138001", "remark": null, "status": 4, "periods": 24, "vehicle": {"id": 1, "uuid": "1", "address": null, "mileage": 50000, "sealInfo": null, "isMortgage": 2, "plateNumber": "京A12345", "usageNature": null, "vehicleCode": "WBAPA21070AL12345", "engineNumber": "B48B20A", "registerDate": "", "vehicleBrand": "宝马", "vehicleColor": "白色", "vehicleModel": "3系", "vehicleOwner": null, "purchasePrice": 35000000, "vehicleImgUrl": ""}, "customer": {"id": 1, "race": null, "uuid": "1", "gender": 1, "nation": null, "telephone": "13800138001", "idcardBack": "", "personName": "张三", "updateTime": "2026-06-13 17:36:00", "idcardFront": "", "personIdcard": null, "personAddress": null, "personValidDateEnd": null, "personValidDateStart": null, "personIssuingAuthority": null}, "pushQuota": "200000.00", "createTime": "2026-06-13 17:36:42", "updateTime": "2026-06-13 17:36:42", "productName": "车抵贷", "businessNode": "PRE_AUDIT", "creditOrderId": "SO20260613001"}}	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-13 17:43:04.162	\N
22	\N	\N	\N	auth	POST	POST /saas/api/auth/login 200 121ms	{"body": {"password": "***", "userName": "Super"}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"token": "***", "refreshToken": "***"}}	172.18.0.1	Mozilla/5.0 (Linux; Android 16; V2419A Build/BP2A.250605.031.A3_V000L1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.178 Mobile Safari/537.36 XWEB/1460205 MMWEBSDK/20260502 MMWEBID/51 REV/67359f4ed01be2f482ec1f36b7b0474c71acc749 MicroMessenger/8.0.74.3120(0x28004A36) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64	2026-06-13 17:43:36.741	\N
23	\N	3	Super	user	GET	GET /saas/api/user/info 200 16ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"email": "super@example.com", "roles": ["R_SUPER"], "avatar": null, "userId": 3, "buttons": ["add"], "userName": "Super"}}	172.18.0.1	Mozilla/5.0 (Linux; Android 16; V2419A Build/BP2A.250605.031.A3_V000L1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.178 Mobile Safari/537.36 XWEB/1460205 MMWEBSDK/20260502 MMWEBID/51 REV/67359f4ed01be2f482ec1f36b7b0474c71acc749 MicroMessenger/8.0.74.3120(0x28004A36) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64	2026-06-13 17:43:36.867	\N
24	\N	3	Super	m	GET	GET /saas/api/m/statistics/overview 200 0ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	172.18.0.1	Mozilla/5.0 (Linux; Android 16; V2419A Build/BP2A.250605.031.A3_V000L1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.178 Mobile Safari/537.36 XWEB/1460205 MMWEBSDK/20260502 MMWEBID/51 REV/67359f4ed01be2f482ec1f36b7b0474c71acc749 MicroMessenger/8.0.74.3120(0x28004A36) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64	2026-06-13 17:43:37.5	\N
25	\N	3	Super	application	GET	GET /saas/api/application/order-list?pageNum=1&pageSize=10 200 17ms	{"body": {}, "query": {"pageNum": "1", "pageSize": "10"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"瞬力矩阵\\",\\"customerId\\":1,\\"uuid\\":\\"1\\",\\"customerName\\":\\"张三\\",\\"personName\\":\\"张三\\",\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"telephone\\":\\"13800138001\\",\\"idCard\\":\\"\\",\\"vehicleId\\":1,\\"plateNumber\\":\\"京A12345\\",\\"vehicleBrand\\":\\"宝马\\",\\"vehicleModel\\":\\"3系\\",\\"vehicleOwner\\":\\"\\",\\"applicationNo\\":\\"SO20260612003\\",\\"orderNo\\":\\"SO20260612003\\",\\"creditOrderId\\":\\"SO20260612003\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[150000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[600000]},\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"status\\":\\"PENDING_RISK_PRE\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1200,\\"nodeCode\\":1200,\\"currentNodeName\\":\\"车辆信息\\",\\"nodeName\\":\\"车辆信息\\",\\"currentStatus\\":20,\\"nodeStatus\\":20,\\"currentStatusName\\":\\"已通过\\",\\"nodeStatusName\\":\\"已通过\\",\\"phaseCode\\":1000,\\"phaseName\\":\\"预审进件\\",\\"productId\\":1,\\"productName\\":\\"车抵贷\\",\\"funderId\\":1,\\"funderName\\":\\"平安银行\\",\\"creatorId\\":3,\\"creatorName\\":\\"Super Admin\\",\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}},{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"瞬力矩阵\\",\\"customerId\\":1,\\"uuid\\":\\"1\\",\\"customerName\\":\\"张三\\",\\"personName\\":\\"张三\\",\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"telephone\\":\\"13800138001\\",\\"idCard\\":\\"\\",\\"vehicleId\\":1,\\"plateNumber\\":\\"京A12345\\",\\"vehicleBrand\\":\\"宝马\\",\\"vehicleModel\\":\\"3系\\",\\"vehicleOwner\\":\\"\\",\\"applicationNo\\":\\"SO20260613001\\",\\"orderNo\\":\\"SO20260613001\\",\\"creditOrderId\\":\\"SO20260613001\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[200000]},\\"term\\":24,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[800000]},\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1100,\\"nodeCode\\":1100,\\"currentNodeName\\":\\"身份证信息\\",\\"nodeName\\":\\"身份证信息\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":1000,\\"phaseName\\":\\"预审进件\\",\\"productId\\":1,\\"productName\\":\\"车抵贷\\",\\"funderId\\":1,\\"funderName\\":\\"平安银行\\",\\"creatorId\\":3,\\"creatorName\\":\\"Super Admin\\",\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}}],\\"current\\":1,\\"size\\":", "truncated": true}	172.18.0.1	Mozilla/5.0 (Linux; Android 16; V2419A Build/BP2A.250605.031.A3_V000L1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.178 Mobile Safari/537.36 XWEB/1460205 MMWEBSDK/20260502 MMWEBID/51 REV/67359f4ed01be2f482ec1f36b7b0474c71acc749 MicroMessenger/8.0.74.3120(0x28004A36) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64	2026-06-13 17:43:39.009	\N
26	\N	3	Super	m	GET	GET /saas/api/m/credit/getCreditDetailByOrderId/SO20260612003 200 7ms	{"body": {}, "query": {}, "params": {"creditOrderId": "SO20260612003"}}	{"msg": "success", "code": 200, "data": {"id": 2, "name": "张三", "uuid": "1", "phone": "13800138001", "remark": null, "status": 4, "periods": 12, "vehicle": {"id": 1, "uuid": "1", "address": null, "mileage": 50000, "sealInfo": null, "isMortgage": 2, "plateNumber": "京A12345", "usageNature": null, "vehicleCode": "WBAPA21070AL12345", "engineNumber": "B48B20A", "registerDate": "", "vehicleBrand": "宝马", "vehicleColor": "白色", "vehicleModel": "3系", "vehicleOwner": null, "purchasePrice": 35000000, "vehicleImgUrl": ""}, "customer": {"id": 1, "race": null, "uuid": "1", "gender": 1, "nation": null, "telephone": "13800138001", "idcardBack": "", "personName": "张三", "updateTime": "2026-06-13 17:36:00", "idcardFront": "", "personIdcard": null, "personAddress": null, "personValidDateEnd": null, "personValidDateStart": null, "personIssuingAuthority": null}, "pushQuota": "150000.00", "createTime": "2026-06-12 17:36:42", "updateTime": "2026-06-13 17:36:42", "productName": "车抵贷", "businessNode": "PRE_AUDIT", "creditOrderId": "SO20260612003"}}	172.18.0.1	Mozilla/5.0 (Linux; Android 16; V2419A Build/BP2A.250605.031.A3_V000L1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.178 Mobile Safari/537.36 XWEB/1460205 MMWEBSDK/20260502 MMWEBID/51 REV/67359f4ed01be2f482ec1f36b7b0474c71acc749 MicroMessenger/8.0.74.3120(0x28004A36) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64	2026-06-13 17:43:39.752	\N
27	\N	3	Super	m	GET	GET /saas/api/m/statistics/overview 200 0ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-13 17:43:45.001	\N
28	\N	3	Super	m	GET	GET /saas/api/m/credit/getCreditDetailByOrderId/SO20260612003 200 8ms	{"body": {}, "query": {}, "params": {"creditOrderId": "SO20260612003"}}	{"msg": "success", "code": 200, "data": {"id": 2, "name": "张三", "uuid": "1", "phone": "13800138001", "remark": null, "status": 4, "periods": 12, "vehicle": {"id": 1, "uuid": "1", "address": null, "mileage": 50000, "sealInfo": null, "isMortgage": 2, "plateNumber": "京A12345", "usageNature": null, "vehicleCode": "WBAPA21070AL12345", "engineNumber": "B48B20A", "registerDate": "", "vehicleBrand": "宝马", "vehicleColor": "白色", "vehicleModel": "3系", "vehicleOwner": null, "purchasePrice": 35000000, "vehicleImgUrl": ""}, "customer": {"id": 1, "race": null, "uuid": "1", "gender": 1, "nation": null, "telephone": "13800138001", "idcardBack": "", "personName": "张三", "updateTime": "2026-06-13 17:36:00", "idcardFront": "", "personIdcard": null, "personAddress": null, "personValidDateEnd": null, "personValidDateStart": null, "personIssuingAuthority": null}, "pushQuota": "150000.00", "createTime": "2026-06-12 17:36:42", "updateTime": "2026-06-13 17:36:42", "productName": "车抵贷", "businessNode": "PRE_AUDIT", "creditOrderId": "SO20260612003"}}	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-13 17:43:50.119	\N
29	\N	3	Super	application	GET	GET /saas/api/application/order-list?pageNum=1&pageSize=10 200 15ms	{"body": {}, "query": {"pageNum": "1", "pageSize": "10"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"瞬力矩阵\\",\\"customerId\\":1,\\"uuid\\":\\"1\\",\\"customerName\\":\\"张三\\",\\"personName\\":\\"张三\\",\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"telephone\\":\\"13800138001\\",\\"idCard\\":\\"\\",\\"vehicleId\\":1,\\"plateNumber\\":\\"京A12345\\",\\"vehicleBrand\\":\\"宝马\\",\\"vehicleModel\\":\\"3系\\",\\"vehicleOwner\\":\\"\\",\\"applicationNo\\":\\"SO20260612003\\",\\"orderNo\\":\\"SO20260612003\\",\\"creditOrderId\\":\\"SO20260612003\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[150000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[600000]},\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"status\\":\\"PENDING_RISK_PRE\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1200,\\"nodeCode\\":1200,\\"currentNodeName\\":\\"车辆信息\\",\\"nodeName\\":\\"车辆信息\\",\\"currentStatus\\":20,\\"nodeStatus\\":20,\\"currentStatusName\\":\\"已通过\\",\\"nodeStatusName\\":\\"已通过\\",\\"phaseCode\\":1000,\\"phaseName\\":\\"预审进件\\",\\"productId\\":1,\\"productName\\":\\"车抵贷\\",\\"funderId\\":1,\\"funderName\\":\\"平安银行\\",\\"creatorId\\":3,\\"creatorName\\":\\"Super Admin\\",\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}},{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"瞬力矩阵\\",\\"customerId\\":1,\\"uuid\\":\\"1\\",\\"customerName\\":\\"张三\\",\\"personName\\":\\"张三\\",\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"telephone\\":\\"13800138001\\",\\"idCard\\":\\"\\",\\"vehicleId\\":1,\\"plateNumber\\":\\"京A12345\\",\\"vehicleBrand\\":\\"宝马\\",\\"vehicleModel\\":\\"3系\\",\\"vehicleOwner\\":\\"\\",\\"applicationNo\\":\\"SO20260613001\\",\\"orderNo\\":\\"SO20260613001\\",\\"creditOrderId\\":\\"SO20260613001\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[200000]},\\"term\\":24,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[800000]},\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1100,\\"nodeCode\\":1100,\\"currentNodeName\\":\\"身份证信息\\",\\"nodeName\\":\\"身份证信息\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":1000,\\"phaseName\\":\\"预审进件\\",\\"productId\\":1,\\"productName\\":\\"车抵贷\\",\\"funderId\\":1,\\"funderName\\":\\"平安银行\\",\\"creatorId\\":3,\\"creatorName\\":\\"Super Admin\\",\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}}],\\"current\\":1,\\"size\\":", "truncated": true}	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-13 17:43:53.89	\N
30	\N	3	Super	m	GET	GET /saas/api/m/credit/getCreditDetailByOrderId/SO20260612003 200 8ms	{"body": {}, "query": {}, "params": {"creditOrderId": "SO20260612003"}}	{"msg": "success", "code": 200, "data": {"id": 2, "name": "张三", "uuid": "1", "phone": "13800138001", "remark": null, "status": 4, "periods": 12, "vehicle": {"id": 1, "uuid": "1", "address": null, "mileage": 50000, "sealInfo": null, "isMortgage": 2, "plateNumber": "京A12345", "usageNature": null, "vehicleCode": "WBAPA21070AL12345", "engineNumber": "B48B20A", "registerDate": "", "vehicleBrand": "宝马", "vehicleColor": "白色", "vehicleModel": "3系", "vehicleOwner": null, "purchasePrice": 35000000, "vehicleImgUrl": ""}, "customer": {"id": 1, "race": null, "uuid": "1", "gender": 1, "nation": null, "telephone": "13800138001", "idcardBack": "", "personName": "张三", "updateTime": "2026-06-13 17:36:00", "idcardFront": "", "personIdcard": null, "personAddress": null, "personValidDateEnd": null, "personValidDateStart": null, "personIssuingAuthority": null}, "pushQuota": "150000.00", "createTime": "2026-06-12 17:36:42", "updateTime": "2026-06-13 17:36:42", "productName": "车抵贷", "businessNode": "PRE_AUDIT", "creditOrderId": "SO20260612003"}}	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-13 17:43:54.917	\N
31	\N	3	Super	m	GET	GET /saas/api/m/statistics/overview 200 1ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	172.18.0.1	Mozilla/5.0 (Linux; Android 16; V2419A Build/BP2A.250605.031.A3_V000L1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.178 Mobile Safari/537.36 XWEB/1460205 MMWEBSDK/20260502 MMWEBID/51 REV/67359f4ed01be2f482ec1f36b7b0474c71acc749 MicroMessenger/8.0.74.3120(0x28004A36) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64	2026-06-13 17:48:28.676	\N
32	\N	\N	\N	auth	POST	POST /saas/api/auth/login 200 156ms	{"body": {"password": "***", "userName": "Super"}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"token": "***", "refreshToken": "***"}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 17:51:15.326	\N
34	\N	3	Super	v3	GET	GET /saas/api/v3/system/menus 200 41ms	{"body": {}, "query": {}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":[{\\"id\\":1,\\"parentId\\":null,\\"path\\":\\"/dashboard\\",\\"name\\":\\"Dashboard\\",\\"component\\":\\"/index/index\\",\\"meta\\":{\\"title\\":\\"仪表盘\\",\\"icon\\":\\"ri:dashboard-line\\",\\"sort\\":10,\\"keepAlive\\":false,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]},\\"children\\":[{\\"id\\":2,\\"parentId\\":1,\\"path\\":\\"console\\",\\"name\\":\\"Console\\",\\"component\\":\\"/dashboard/console\\",\\"meta\\":{\\"title\\":\\"工作台\\",\\"icon\\":\\"ri:computer-line\\",\\"sort\\":11,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]}},{\\"id\\":3,\\"parentId\\":1,\\"path\\":\\"analysis\\",\\"name\\":\\"Analysis\\",\\"component\\":\\"/dashboard/analysis\\",\\"meta\\":{\\"title\\":\\"分析页\\",\\"icon\\":\\"ri:line-chart-line\\",\\"sort\\":12,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]}}]},{\\"id\\":12,\\"parentId\\":null,\\"path\\":\\"/platform\\",\\"name\\":\\"Platform\\",\\"component\\":\\"/index/index\\",\\"meta\\":{\\"title\\":\\"平台管理\\",\\"icon\\":\\"ri:global-line\\",\\"sort\\":20,\\"keepAlive\\":false,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\"],\\"authList\\":[]},\\"children\\":[{\\"id\\":13,\\"parentId\\":12,\\"path\\":\\"tenant\\",\\"name\\":\\"TenantMgmt\\",\\"component\\":\\"/business/common-list\\",\\"meta\\":{\\"title\\":\\"租户机构管理\\",\\"icon\\":\\"ri:building-2-line\\",\\"sort\\":21,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\"],\\"authList\\":[{\\"id\\":4,\\"title\\":\\"Add\\",\\"authMark\\":\\"add\\",\\"roles\\":[]},{\\"id\\":5,\\"title\\":\\"Edit\\",\\"authMark\\":\\"edit\\",\\"roles\\":[]},{\\"id\\":6,\\"title\\":\\"Delete\\",\\"authMark\\":\\"delete\\",\\"roles\\":[]}]}},{\\"id\\":14,\\"parentId\\":12,\\"path\\":\\"package-billing\\",\\"name\\":\\"PackageBilling\\",\\"component\\":\\"", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 17:51:15.45	\N
35	\N	3	Super	data-center	GET	GET /saas/api/data-center/stats 200 153ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"phases": [{"code": 1000, "name": "预审阶段", "count": 2}, {"code": 1400, "name": "补件阶段", "count": 0}, {"code": 2000, "name": "风控审批", "count": 0}, {"code": 3000, "name": "资方终审", "count": 0}, {"code": 4000, "name": "客户签约", "count": 0}, {"code": 5000, "name": "请款放款", "count": 0}], "trends": [{"day": "2026-06-12", "count": 1, "amount": 150000}, {"day": "2026-06-13", "count": 1, "amount": 200000}], "funders": [{"id": 1, "name": "平安银行", "count": 2, "amount": 350000}], "overview": {"passRate": 0, "leadTotal": 1, "customerTotal": 1, "rejectedCount": 0, "approvedAmount": 0, "disbursedCount": 0, "disbursedAmount": 0, "requestedAmount": 350000, "applicationTotal": 2, "activeFunderTotal": 1, "activeProductTotal": 1, "pendingRepaymentAmount": 0}, "products": [{"id": 1, "name": "车抵贷", "count": 2, "amount": 350000}], "statuses": [{"count": 1, "status": "SUBMITTED"}, {"count": 1, "status": "PENDING_RISK_PRE"}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 17:51:21.866	\N
36	\N	3	Super	user	GET	GET /saas/api/user/info 200 103ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"email": "super@example.com", "roles": ["R_SUPER"], "avatar": null, "userId": 3, "buttons": ["add"], "userName": "Super"}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:12:28.465	\N
37	\N	3	Super	v3	GET	GET /saas/api/v3/system/menus 200 37ms	{"body": {}, "query": {}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":[{\\"id\\":1,\\"parentId\\":null,\\"path\\":\\"/dashboard\\",\\"name\\":\\"Dashboard\\",\\"component\\":\\"/index/index\\",\\"meta\\":{\\"title\\":\\"仪表盘\\",\\"icon\\":\\"ri:dashboard-line\\",\\"sort\\":10,\\"keepAlive\\":false,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]},\\"children\\":[{\\"id\\":2,\\"parentId\\":1,\\"path\\":\\"console\\",\\"name\\":\\"Console\\",\\"component\\":\\"/dashboard/console\\",\\"meta\\":{\\"title\\":\\"工作台\\",\\"icon\\":\\"ri:computer-line\\",\\"sort\\":11,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]}},{\\"id\\":3,\\"parentId\\":1,\\"path\\":\\"analysis\\",\\"name\\":\\"Analysis\\",\\"component\\":\\"/dashboard/analysis\\",\\"meta\\":{\\"title\\":\\"分析页\\",\\"icon\\":\\"ri:line-chart-line\\",\\"sort\\":12,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]}}]},{\\"id\\":12,\\"parentId\\":null,\\"path\\":\\"/platform\\",\\"name\\":\\"Platform\\",\\"component\\":\\"/index/index\\",\\"meta\\":{\\"title\\":\\"平台管理\\",\\"icon\\":\\"ri:global-line\\",\\"sort\\":20,\\"keepAlive\\":false,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\"],\\"authList\\":[]},\\"children\\":[{\\"id\\":13,\\"parentId\\":12,\\"path\\":\\"tenant\\",\\"name\\":\\"TenantMgmt\\",\\"component\\":\\"/business/common-list\\",\\"meta\\":{\\"title\\":\\"租户机构管理\\",\\"icon\\":\\"ri:building-2-line\\",\\"sort\\":21,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\"],\\"authList\\":[{\\"id\\":4,\\"title\\":\\"Add\\",\\"authMark\\":\\"add\\",\\"roles\\":[]},{\\"id\\":5,\\"title\\":\\"Edit\\",\\"authMark\\":\\"edit\\",\\"roles\\":[]},{\\"id\\":6,\\"title\\":\\"Delete\\",\\"authMark\\":\\"delete\\",\\"roles\\":[]}]}},{\\"id\\":14,\\"parentId\\":12,\\"path\\":\\"package-billing\\",\\"name\\":\\"PackageBilling\\",\\"component\\":\\"", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:12:28.547	\N
38	\N	3	Super	data-center	GET	GET /saas/api/data-center/stats 200 73ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"phases": [{"code": 1000, "name": "预审阶段", "count": 2}, {"code": 1400, "name": "补件阶段", "count": 0}, {"code": 2000, "name": "风控审批", "count": 0}, {"code": 3000, "name": "资方终审", "count": 0}, {"code": 4000, "name": "客户签约", "count": 0}, {"code": 5000, "name": "请款放款", "count": 0}], "trends": [{"day": "2026-06-12", "count": 1, "amount": 150000}, {"day": "2026-06-13", "count": 1, "amount": 200000}], "funders": [{"id": 1, "name": "平安银行", "count": 2, "amount": 350000}], "overview": {"passRate": 0, "leadTotal": 1, "customerTotal": 1, "rejectedCount": 0, "approvedAmount": 0, "disbursedCount": 0, "disbursedAmount": 0, "requestedAmount": 350000, "applicationTotal": 2, "activeFunderTotal": 1, "activeProductTotal": 1, "pendingRepaymentAmount": 0}, "products": [{"id": 1, "name": "车抵贷", "count": 2, "amount": 350000}], "statuses": [{"count": 1, "status": "SUBMITTED"}, {"count": 1, "status": "PENDING_RISK_PRE"}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:12:32.757	\N
39	\N	3	Super	user	GET	GET /saas/api/user/info 200 116ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"email": "super@example.com", "roles": ["R_SUPER"], "avatar": null, "userId": 3, "buttons": ["add"], "userName": "Super"}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:19:21.666	\N
40	\N	3	Super	v3	GET	GET /saas/api/v3/system/menus 200 27ms	{"body": {}, "query": {}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":[{\\"id\\":1,\\"parentId\\":null,\\"path\\":\\"/dashboard\\",\\"name\\":\\"Dashboard\\",\\"component\\":\\"/index/index\\",\\"meta\\":{\\"title\\":\\"仪表盘\\",\\"icon\\":\\"ri:dashboard-line\\",\\"sort\\":10,\\"keepAlive\\":false,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]},\\"children\\":[{\\"id\\":2,\\"parentId\\":1,\\"path\\":\\"console\\",\\"name\\":\\"Console\\",\\"component\\":\\"/dashboard/console\\",\\"meta\\":{\\"title\\":\\"工作台\\",\\"icon\\":\\"ri:computer-line\\",\\"sort\\":11,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]}},{\\"id\\":3,\\"parentId\\":1,\\"path\\":\\"analysis\\",\\"name\\":\\"Analysis\\",\\"component\\":\\"/dashboard/analysis\\",\\"meta\\":{\\"title\\":\\"分析页\\",\\"icon\\":\\"ri:line-chart-line\\",\\"sort\\":12,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]}}]},{\\"id\\":12,\\"parentId\\":null,\\"path\\":\\"/platform\\",\\"name\\":\\"Platform\\",\\"component\\":\\"/index/index\\",\\"meta\\":{\\"title\\":\\"平台管理\\",\\"icon\\":\\"ri:global-line\\",\\"sort\\":20,\\"keepAlive\\":false,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\"],\\"authList\\":[]},\\"children\\":[{\\"id\\":13,\\"parentId\\":12,\\"path\\":\\"tenant\\",\\"name\\":\\"TenantMgmt\\",\\"component\\":\\"/business/common-list\\",\\"meta\\":{\\"title\\":\\"租户机构管理\\",\\"icon\\":\\"ri:building-2-line\\",\\"sort\\":21,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\"],\\"authList\\":[{\\"id\\":4,\\"title\\":\\"Add\\",\\"authMark\\":\\"add\\",\\"roles\\":[]},{\\"id\\":5,\\"title\\":\\"Edit\\",\\"authMark\\":\\"edit\\",\\"roles\\":[]},{\\"id\\":6,\\"title\\":\\"Delete\\",\\"authMark\\":\\"delete\\",\\"roles\\":[]}]}},{\\"id\\":14,\\"parentId\\":12,\\"path\\":\\"package-billing\\",\\"name\\":\\"PackageBilling\\",\\"component\\":\\"", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:19:21.74	\N
41	\N	3	Super	data-center	GET	GET /saas/api/data-center/stats 200 68ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"phases": [{"code": 1000, "name": "预审阶段", "count": 2}, {"code": 1400, "name": "补件阶段", "count": 0}, {"code": 2000, "name": "风控审批", "count": 0}, {"code": 3000, "name": "资方终审", "count": 0}, {"code": 4000, "name": "客户签约", "count": 0}, {"code": 5000, "name": "请款放款", "count": 0}], "trends": [{"day": "2026-06-12", "count": 1, "amount": 150000}, {"day": "2026-06-13", "count": 1, "amount": 200000}], "funders": [{"id": 1, "name": "平安银行", "count": 2, "amount": 350000}], "overview": {"passRate": 0, "leadTotal": 1, "customerTotal": 1, "rejectedCount": 0, "approvedAmount": 0, "disbursedCount": 0, "disbursedAmount": 0, "requestedAmount": 350000, "applicationTotal": 2, "activeFunderTotal": 1, "activeProductTotal": 1, "pendingRepaymentAmount": 0}, "products": [{"id": 1, "name": "车抵贷", "count": 2, "amount": 350000}], "statuses": [{"count": 1, "status": "SUBMITTED"}, {"count": 1, "status": "PENDING_RISK_PRE"}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:19:29.841	\N
42	\N	3	Super	user	GET	GET /saas/api/user/info 200 105ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"email": "super@example.com", "roles": ["R_SUPER"], "avatar": null, "userId": 3, "buttons": ["add"], "userName": "Super"}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:31:51.825	\N
43	\N	3	Super	v3	GET	GET /saas/api/v3/system/menus 200 34ms	{"body": {}, "query": {}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":[{\\"id\\":1,\\"parentId\\":null,\\"path\\":\\"/dashboard\\",\\"name\\":\\"Dashboard\\",\\"component\\":\\"/index/index\\",\\"meta\\":{\\"title\\":\\"仪表盘\\",\\"icon\\":\\"ri:dashboard-line\\",\\"sort\\":10,\\"keepAlive\\":false,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]},\\"children\\":[{\\"id\\":2,\\"parentId\\":1,\\"path\\":\\"console\\",\\"name\\":\\"Console\\",\\"component\\":\\"/dashboard/console\\",\\"meta\\":{\\"title\\":\\"工作台\\",\\"icon\\":\\"ri:computer-line\\",\\"sort\\":11,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]}},{\\"id\\":3,\\"parentId\\":1,\\"path\\":\\"analysis\\",\\"name\\":\\"Analysis\\",\\"component\\":\\"/dashboard/analysis\\",\\"meta\\":{\\"title\\":\\"分析页\\",\\"icon\\":\\"ri:line-chart-line\\",\\"sort\\":12,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]}}]},{\\"id\\":12,\\"parentId\\":null,\\"path\\":\\"/platform\\",\\"name\\":\\"Platform\\",\\"component\\":\\"/index/index\\",\\"meta\\":{\\"title\\":\\"平台管理\\",\\"icon\\":\\"ri:global-line\\",\\"sort\\":20,\\"keepAlive\\":false,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\"],\\"authList\\":[]},\\"children\\":[{\\"id\\":13,\\"parentId\\":12,\\"path\\":\\"tenant\\",\\"name\\":\\"TenantMgmt\\",\\"component\\":\\"/business/common-list\\",\\"meta\\":{\\"title\\":\\"租户机构管理\\",\\"icon\\":\\"ri:building-2-line\\",\\"sort\\":21,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\"],\\"authList\\":[{\\"id\\":4,\\"title\\":\\"Add\\",\\"authMark\\":\\"add\\",\\"roles\\":[]},{\\"id\\":5,\\"title\\":\\"Edit\\",\\"authMark\\":\\"edit\\",\\"roles\\":[]},{\\"id\\":6,\\"title\\":\\"Delete\\",\\"authMark\\":\\"delete\\",\\"roles\\":[]}]}},{\\"id\\":14,\\"parentId\\":12,\\"path\\":\\"package-billing\\",\\"name\\":\\"PackageBilling\\",\\"component\\":\\"", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:31:51.909	\N
44	\N	3	Super	application	GET	GET /saas/api/application/list?current=1&size=20 200 54ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"customerId\\":1,\\"productId\\":1,\\"funderId\\":1,\\"applicationNo\\":\\"SO20260612003\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[150000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[600000]},\\"repaymentMethod\\":\\"等额本息\\",\\"purpose\\":\\"车辆抵押贷款\\",\\"status\\":\\"PENDING_RISK_PRE\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1200,\\"currentStatus\\":20,\\"creatorId\\":3,\\"sourceLeadId\\":null,\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"customer\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"idCard\\":null,\\"gender\\":\\"MALE\\",\\"birthDate\\":null,\\"nation\\":null,\\"householdAddress\\":null,\\"issuingAuthority\\":null,\\"idCardValidFrom\\":null,\\"idCardValidTo\\":null,\\"idCardFront\\":null,\\"idCardBack\\":null,\\"maritalStatus\\":null,\\"education\\":null,\\"occupation\\":null,\\"companyName\\":null,\\"monthlyIncome\\":null,\\"address\\":null,\\"emergencyName\\":null,\\"emergencyPhone\\":null,\\"status\\":\\"ACTIVE\\",\\"createdAt\\":{},\\"updatedAt\\":{}},\\"product\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"车抵贷\\",\\"productType\\":\\"抵押贷\\",\\"minRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"maxRate\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[1200000]},\\"minAmount\\":{\\"s\\":1,\\"e\\":4,\\"d\\":[10000]},\\"maxAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[500000]},\\"minTerm\\":6,\\"maxTerm\\":36,\\"repaymentMethod\\":\\"等额本息\\",\\"minAge\\":null,\\"maxAge\\":null,\\"maxCarAge\\":null,\\"maxMileage\\":null,\\"ltvLimit\\":null,\\"minDownPayment\\":null,\\"regions\\":null,\\"applicableFunders\\":null,\\"accessConditions\\":null,\\"valuationDiscountRate\\":null,\\"status\\":\\"ACTIVE\\",\\"fileChecklist\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"funder\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"平安银行\\",\\"code\\":\\"PABANK\\",\\"funderType\\":\\"BANK\\",\\"contactName\\":null,\\"contactPhone\\":null,\\"integrationMode\\":\\"MANUAL\\",\\"creditLimit\\":null,\\"apiConfig\\":null,\\"appro", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:31:55.649	\N
45	\N	3	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 60ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 1, "current": 1, "records": [{"id": 1, "code": "1", "name": "瞬力矩阵", "_count": {"funders": 1, "products": 1, "customers": 1, "departments": 0, "applications": 2}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:31:55.66	\N
46	\N	3	Super	application	GET	GET /saas/api/application/list?current=1&size=20 200 17ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"customerId\\":1,\\"productId\\":1,\\"funderId\\":1,\\"applicationNo\\":\\"SO20260612003\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[150000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[600000]},\\"repaymentMethod\\":\\"等额本息\\",\\"purpose\\":\\"车辆抵押贷款\\",\\"status\\":\\"PENDING_RISK_PRE\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1200,\\"currentStatus\\":20,\\"creatorId\\":3,\\"sourceLeadId\\":null,\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"customer\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"idCard\\":null,\\"gender\\":\\"MALE\\",\\"birthDate\\":null,\\"nation\\":null,\\"householdAddress\\":null,\\"issuingAuthority\\":null,\\"idCardValidFrom\\":null,\\"idCardValidTo\\":null,\\"idCardFront\\":null,\\"idCardBack\\":null,\\"maritalStatus\\":null,\\"education\\":null,\\"occupation\\":null,\\"companyName\\":null,\\"monthlyIncome\\":null,\\"address\\":null,\\"emergencyName\\":null,\\"emergencyPhone\\":null,\\"status\\":\\"ACTIVE\\",\\"createdAt\\":{},\\"updatedAt\\":{}},\\"product\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"车抵贷\\",\\"productType\\":\\"抵押贷\\",\\"minRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"maxRate\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[1200000]},\\"minAmount\\":{\\"s\\":1,\\"e\\":4,\\"d\\":[10000]},\\"maxAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[500000]},\\"minTerm\\":6,\\"maxTerm\\":36,\\"repaymentMethod\\":\\"等额本息\\",\\"minAge\\":null,\\"maxAge\\":null,\\"maxCarAge\\":null,\\"maxMileage\\":null,\\"ltvLimit\\":null,\\"minDownPayment\\":null,\\"regions\\":null,\\"applicableFunders\\":null,\\"accessConditions\\":null,\\"valuationDiscountRate\\":null,\\"status\\":\\"ACTIVE\\",\\"fileChecklist\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"funder\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"平安银行\\",\\"code\\":\\"PABANK\\",\\"funderType\\":\\"BANK\\",\\"contactName\\":null,\\"contactPhone\\":null,\\"integrationMode\\":\\"MANUAL\\",\\"creditLimit\\":null,\\"apiConfig\\":null,\\"appro", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:31:55.697	\N
118	\N	3	Super	m	GET	GET /saas/api/m/statistics/overview 200 1ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-14 01:56:10.395	\N
47	\N	3	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 18ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 1, "current": 1, "records": [{"id": 1, "code": "1", "name": "瞬力矩阵", "_count": {"funders": 1, "products": 1, "customers": 1, "departments": 0, "applications": 2}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:31:57.346	\N
54	\N	3	Super	application	GET	GET /saas/api/application/list?current=1&size=20 200 30ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"customerId\\":1,\\"productId\\":1,\\"funderId\\":1,\\"applicationNo\\":\\"SO20260612003\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[150000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[600000]},\\"repaymentMethod\\":\\"等额本息\\",\\"purpose\\":\\"车辆抵押贷款\\",\\"status\\":\\"PENDING_RISK_PRE\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1200,\\"currentStatus\\":20,\\"creatorId\\":3,\\"sourceLeadId\\":null,\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"customer\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"idCard\\":null,\\"gender\\":\\"MALE\\",\\"birthDate\\":null,\\"nation\\":null,\\"householdAddress\\":null,\\"issuingAuthority\\":null,\\"idCardValidFrom\\":null,\\"idCardValidTo\\":null,\\"idCardFront\\":null,\\"idCardBack\\":null,\\"maritalStatus\\":null,\\"education\\":null,\\"occupation\\":null,\\"companyName\\":null,\\"monthlyIncome\\":null,\\"address\\":null,\\"emergencyName\\":null,\\"emergencyPhone\\":null,\\"status\\":\\"ACTIVE\\",\\"createdAt\\":{},\\"updatedAt\\":{}},\\"product\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"车抵贷\\",\\"productType\\":\\"抵押贷\\",\\"minRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"maxRate\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[1200000]},\\"minAmount\\":{\\"s\\":1,\\"e\\":4,\\"d\\":[10000]},\\"maxAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[500000]},\\"minTerm\\":6,\\"maxTerm\\":36,\\"repaymentMethod\\":\\"等额本息\\",\\"minAge\\":null,\\"maxAge\\":null,\\"maxCarAge\\":null,\\"maxMileage\\":null,\\"ltvLimit\\":null,\\"minDownPayment\\":null,\\"regions\\":null,\\"applicableFunders\\":null,\\"accessConditions\\":null,\\"valuationDiscountRate\\":null,\\"status\\":\\"ACTIVE\\",\\"fileChecklist\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"funder\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"平安银行\\",\\"code\\":\\"PABANK\\",\\"funderType\\":\\"BANK\\",\\"contactName\\":null,\\"contactPhone\\":null,\\"integrationMode\\":\\"MANUAL\\",\\"creditLimit\\":null,\\"apiConfig\\":null,\\"appro", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:31:59.461	\N
55	\N	3	Super	application	GET	GET /saas/api/application/list?current=1&size=20 200 18ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"customerId\\":1,\\"productId\\":1,\\"funderId\\":1,\\"applicationNo\\":\\"SO20260612003\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[150000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[600000]},\\"repaymentMethod\\":\\"等额本息\\",\\"purpose\\":\\"车辆抵押贷款\\",\\"status\\":\\"PENDING_RISK_PRE\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1200,\\"currentStatus\\":20,\\"creatorId\\":3,\\"sourceLeadId\\":null,\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"customer\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"idCard\\":null,\\"gender\\":\\"MALE\\",\\"birthDate\\":null,\\"nation\\":null,\\"householdAddress\\":null,\\"issuingAuthority\\":null,\\"idCardValidFrom\\":null,\\"idCardValidTo\\":null,\\"idCardFront\\":null,\\"idCardBack\\":null,\\"maritalStatus\\":null,\\"education\\":null,\\"occupation\\":null,\\"companyName\\":null,\\"monthlyIncome\\":null,\\"address\\":null,\\"emergencyName\\":null,\\"emergencyPhone\\":null,\\"status\\":\\"ACTIVE\\",\\"createdAt\\":{},\\"updatedAt\\":{}},\\"product\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"车抵贷\\",\\"productType\\":\\"抵押贷\\",\\"minRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"maxRate\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[1200000]},\\"minAmount\\":{\\"s\\":1,\\"e\\":4,\\"d\\":[10000]},\\"maxAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[500000]},\\"minTerm\\":6,\\"maxTerm\\":36,\\"repaymentMethod\\":\\"等额本息\\",\\"minAge\\":null,\\"maxAge\\":null,\\"maxCarAge\\":null,\\"maxMileage\\":null,\\"ltvLimit\\":null,\\"minDownPayment\\":null,\\"regions\\":null,\\"applicableFunders\\":null,\\"accessConditions\\":null,\\"valuationDiscountRate\\":null,\\"status\\":\\"ACTIVE\\",\\"fileChecklist\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"funder\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"平安银行\\",\\"code\\":\\"PABANK\\",\\"funderType\\":\\"BANK\\",\\"contactName\\":null,\\"contactPhone\\":null,\\"integrationMode\\":\\"MANUAL\\",\\"creditLimit\\":null,\\"apiConfig\\":null,\\"appro", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:31:59.514	\N
48	\N	3	Super	application	GET	GET /saas/api/application/list?current=1&size=20 200 45ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"customerId\\":1,\\"productId\\":1,\\"funderId\\":1,\\"applicationNo\\":\\"SO20260612003\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[150000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[600000]},\\"repaymentMethod\\":\\"等额本息\\",\\"purpose\\":\\"车辆抵押贷款\\",\\"status\\":\\"PENDING_RISK_PRE\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1200,\\"currentStatus\\":20,\\"creatorId\\":3,\\"sourceLeadId\\":null,\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"customer\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"idCard\\":null,\\"gender\\":\\"MALE\\",\\"birthDate\\":null,\\"nation\\":null,\\"householdAddress\\":null,\\"issuingAuthority\\":null,\\"idCardValidFrom\\":null,\\"idCardValidTo\\":null,\\"idCardFront\\":null,\\"idCardBack\\":null,\\"maritalStatus\\":null,\\"education\\":null,\\"occupation\\":null,\\"companyName\\":null,\\"monthlyIncome\\":null,\\"address\\":null,\\"emergencyName\\":null,\\"emergencyPhone\\":null,\\"status\\":\\"ACTIVE\\",\\"createdAt\\":{},\\"updatedAt\\":{}},\\"product\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"车抵贷\\",\\"productType\\":\\"抵押贷\\",\\"minRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"maxRate\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[1200000]},\\"minAmount\\":{\\"s\\":1,\\"e\\":4,\\"d\\":[10000]},\\"maxAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[500000]},\\"minTerm\\":6,\\"maxTerm\\":36,\\"repaymentMethod\\":\\"等额本息\\",\\"minAge\\":null,\\"maxAge\\":null,\\"maxCarAge\\":null,\\"maxMileage\\":null,\\"ltvLimit\\":null,\\"minDownPayment\\":null,\\"regions\\":null,\\"applicableFunders\\":null,\\"accessConditions\\":null,\\"valuationDiscountRate\\":null,\\"status\\":\\"ACTIVE\\",\\"fileChecklist\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"funder\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"平安银行\\",\\"code\\":\\"PABANK\\",\\"funderType\\":\\"BANK\\",\\"contactName\\":null,\\"contactPhone\\":null,\\"integrationMode\\":\\"MANUAL\\",\\"creditLimit\\":null,\\"apiConfig\\":null,\\"appro", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:31:57.38	\N
49	\N	3	Super	application	GET	GET /saas/api/application/list?current=1&size=20 200 20ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"customerId\\":1,\\"productId\\":1,\\"funderId\\":1,\\"applicationNo\\":\\"SO20260612003\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[150000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[600000]},\\"repaymentMethod\\":\\"等额本息\\",\\"purpose\\":\\"车辆抵押贷款\\",\\"status\\":\\"PENDING_RISK_PRE\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1200,\\"currentStatus\\":20,\\"creatorId\\":3,\\"sourceLeadId\\":null,\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"customer\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"idCard\\":null,\\"gender\\":\\"MALE\\",\\"birthDate\\":null,\\"nation\\":null,\\"householdAddress\\":null,\\"issuingAuthority\\":null,\\"idCardValidFrom\\":null,\\"idCardValidTo\\":null,\\"idCardFront\\":null,\\"idCardBack\\":null,\\"maritalStatus\\":null,\\"education\\":null,\\"occupation\\":null,\\"companyName\\":null,\\"monthlyIncome\\":null,\\"address\\":null,\\"emergencyName\\":null,\\"emergencyPhone\\":null,\\"status\\":\\"ACTIVE\\",\\"createdAt\\":{},\\"updatedAt\\":{}},\\"product\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"车抵贷\\",\\"productType\\":\\"抵押贷\\",\\"minRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"maxRate\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[1200000]},\\"minAmount\\":{\\"s\\":1,\\"e\\":4,\\"d\\":[10000]},\\"maxAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[500000]},\\"minTerm\\":6,\\"maxTerm\\":36,\\"repaymentMethod\\":\\"等额本息\\",\\"minAge\\":null,\\"maxAge\\":null,\\"maxCarAge\\":null,\\"maxMileage\\":null,\\"ltvLimit\\":null,\\"minDownPayment\\":null,\\"regions\\":null,\\"applicableFunders\\":null,\\"accessConditions\\":null,\\"valuationDiscountRate\\":null,\\"status\\":\\"ACTIVE\\",\\"fileChecklist\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"funder\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"平安银行\\",\\"code\\":\\"PABANK\\",\\"funderType\\":\\"BANK\\",\\"contactName\\":null,\\"contactPhone\\":null,\\"integrationMode\\":\\"MANUAL\\",\\"creditLimit\\":null,\\"apiConfig\\":null,\\"appro", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:31:57.448	\N
50	\N	3	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 17ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 1, "current": 1, "records": [{"id": 1, "code": "1", "name": "瞬力矩阵", "_count": {"funders": 1, "products": 1, "customers": 1, "departments": 0, "applications": 2}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:31:58.307	\N
51	\N	3	Super	application	GET	GET /saas/api/application/list?current=1&size=20 200 24ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"customerId\\":1,\\"productId\\":1,\\"funderId\\":1,\\"applicationNo\\":\\"SO20260612003\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[150000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[600000]},\\"repaymentMethod\\":\\"等额本息\\",\\"purpose\\":\\"车辆抵押贷款\\",\\"status\\":\\"PENDING_RISK_PRE\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1200,\\"currentStatus\\":20,\\"creatorId\\":3,\\"sourceLeadId\\":null,\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"customer\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"idCard\\":null,\\"gender\\":\\"MALE\\",\\"birthDate\\":null,\\"nation\\":null,\\"householdAddress\\":null,\\"issuingAuthority\\":null,\\"idCardValidFrom\\":null,\\"idCardValidTo\\":null,\\"idCardFront\\":null,\\"idCardBack\\":null,\\"maritalStatus\\":null,\\"education\\":null,\\"occupation\\":null,\\"companyName\\":null,\\"monthlyIncome\\":null,\\"address\\":null,\\"emergencyName\\":null,\\"emergencyPhone\\":null,\\"status\\":\\"ACTIVE\\",\\"createdAt\\":{},\\"updatedAt\\":{}},\\"product\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"车抵贷\\",\\"productType\\":\\"抵押贷\\",\\"minRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"maxRate\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[1200000]},\\"minAmount\\":{\\"s\\":1,\\"e\\":4,\\"d\\":[10000]},\\"maxAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[500000]},\\"minTerm\\":6,\\"maxTerm\\":36,\\"repaymentMethod\\":\\"等额本息\\",\\"minAge\\":null,\\"maxAge\\":null,\\"maxCarAge\\":null,\\"maxMileage\\":null,\\"ltvLimit\\":null,\\"minDownPayment\\":null,\\"regions\\":null,\\"applicableFunders\\":null,\\"accessConditions\\":null,\\"valuationDiscountRate\\":null,\\"status\\":\\"ACTIVE\\",\\"fileChecklist\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"funder\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"平安银行\\",\\"code\\":\\"PABANK\\",\\"funderType\\":\\"BANK\\",\\"contactName\\":null,\\"contactPhone\\":null,\\"integrationMode\\":\\"MANUAL\\",\\"creditLimit\\":null,\\"apiConfig\\":null,\\"appro", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:31:58.313	\N
52	\N	3	Super	application	GET	GET /saas/api/application/list?current=1&size=20 200 13ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"customerId\\":1,\\"productId\\":1,\\"funderId\\":1,\\"applicationNo\\":\\"SO20260612003\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[150000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[600000]},\\"repaymentMethod\\":\\"等额本息\\",\\"purpose\\":\\"车辆抵押贷款\\",\\"status\\":\\"PENDING_RISK_PRE\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1200,\\"currentStatus\\":20,\\"creatorId\\":3,\\"sourceLeadId\\":null,\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"customer\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"idCard\\":null,\\"gender\\":\\"MALE\\",\\"birthDate\\":null,\\"nation\\":null,\\"householdAddress\\":null,\\"issuingAuthority\\":null,\\"idCardValidFrom\\":null,\\"idCardValidTo\\":null,\\"idCardFront\\":null,\\"idCardBack\\":null,\\"maritalStatus\\":null,\\"education\\":null,\\"occupation\\":null,\\"companyName\\":null,\\"monthlyIncome\\":null,\\"address\\":null,\\"emergencyName\\":null,\\"emergencyPhone\\":null,\\"status\\":\\"ACTIVE\\",\\"createdAt\\":{},\\"updatedAt\\":{}},\\"product\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"车抵贷\\",\\"productType\\":\\"抵押贷\\",\\"minRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"maxRate\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[1200000]},\\"minAmount\\":{\\"s\\":1,\\"e\\":4,\\"d\\":[10000]},\\"maxAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[500000]},\\"minTerm\\":6,\\"maxTerm\\":36,\\"repaymentMethod\\":\\"等额本息\\",\\"minAge\\":null,\\"maxAge\\":null,\\"maxCarAge\\":null,\\"maxMileage\\":null,\\"ltvLimit\\":null,\\"minDownPayment\\":null,\\"regions\\":null,\\"applicableFunders\\":null,\\"accessConditions\\":null,\\"valuationDiscountRate\\":null,\\"status\\":\\"ACTIVE\\",\\"fileChecklist\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"funder\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"平安银行\\",\\"code\\":\\"PABANK\\",\\"funderType\\":\\"BANK\\",\\"contactName\\":null,\\"contactPhone\\":null,\\"integrationMode\\":\\"MANUAL\\",\\"creditLimit\\":null,\\"apiConfig\\":null,\\"appro", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:31:58.356	\N
53	\N	3	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 23ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 1, "current": 1, "records": [{"id": 1, "code": "1", "name": "瞬力矩阵", "_count": {"funders": 1, "products": 1, "customers": 1, "departments": 0, "applications": 2}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:31:59.451	\N
56	\N	3	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 15ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 1, "current": 1, "records": [{"id": 1, "code": "1", "name": "瞬力矩阵", "_count": {"funders": 1, "products": 1, "customers": 1, "departments": 0, "applications": 2}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:00.371	\N
57	\N	3	Super	application	GET	GET /saas/api/application/list?current=1&size=20 200 27ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"customerId\\":1,\\"productId\\":1,\\"funderId\\":1,\\"applicationNo\\":\\"SO20260612003\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[150000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[600000]},\\"repaymentMethod\\":\\"等额本息\\",\\"purpose\\":\\"车辆抵押贷款\\",\\"status\\":\\"PENDING_RISK_PRE\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1200,\\"currentStatus\\":20,\\"creatorId\\":3,\\"sourceLeadId\\":null,\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"customer\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"idCard\\":null,\\"gender\\":\\"MALE\\",\\"birthDate\\":null,\\"nation\\":null,\\"householdAddress\\":null,\\"issuingAuthority\\":null,\\"idCardValidFrom\\":null,\\"idCardValidTo\\":null,\\"idCardFront\\":null,\\"idCardBack\\":null,\\"maritalStatus\\":null,\\"education\\":null,\\"occupation\\":null,\\"companyName\\":null,\\"monthlyIncome\\":null,\\"address\\":null,\\"emergencyName\\":null,\\"emergencyPhone\\":null,\\"status\\":\\"ACTIVE\\",\\"createdAt\\":{},\\"updatedAt\\":{}},\\"product\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"车抵贷\\",\\"productType\\":\\"抵押贷\\",\\"minRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"maxRate\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[1200000]},\\"minAmount\\":{\\"s\\":1,\\"e\\":4,\\"d\\":[10000]},\\"maxAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[500000]},\\"minTerm\\":6,\\"maxTerm\\":36,\\"repaymentMethod\\":\\"等额本息\\",\\"minAge\\":null,\\"maxAge\\":null,\\"maxCarAge\\":null,\\"maxMileage\\":null,\\"ltvLimit\\":null,\\"minDownPayment\\":null,\\"regions\\":null,\\"applicableFunders\\":null,\\"accessConditions\\":null,\\"valuationDiscountRate\\":null,\\"status\\":\\"ACTIVE\\",\\"fileChecklist\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"funder\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"平安银行\\",\\"code\\":\\"PABANK\\",\\"funderType\\":\\"BANK\\",\\"contactName\\":null,\\"contactPhone\\":null,\\"integrationMode\\":\\"MANUAL\\",\\"creditLimit\\":null,\\"apiConfig\\":null,\\"appro", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:00.371	\N
58	\N	3	Super	application	GET	GET /saas/api/application/list?current=1&size=20 200 12ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"customerId\\":1,\\"productId\\":1,\\"funderId\\":1,\\"applicationNo\\":\\"SO20260612003\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[150000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[600000]},\\"repaymentMethod\\":\\"等额本息\\",\\"purpose\\":\\"车辆抵押贷款\\",\\"status\\":\\"PENDING_RISK_PRE\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1200,\\"currentStatus\\":20,\\"creatorId\\":3,\\"sourceLeadId\\":null,\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"customer\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"idCard\\":null,\\"gender\\":\\"MALE\\",\\"birthDate\\":null,\\"nation\\":null,\\"householdAddress\\":null,\\"issuingAuthority\\":null,\\"idCardValidFrom\\":null,\\"idCardValidTo\\":null,\\"idCardFront\\":null,\\"idCardBack\\":null,\\"maritalStatus\\":null,\\"education\\":null,\\"occupation\\":null,\\"companyName\\":null,\\"monthlyIncome\\":null,\\"address\\":null,\\"emergencyName\\":null,\\"emergencyPhone\\":null,\\"status\\":\\"ACTIVE\\",\\"createdAt\\":{},\\"updatedAt\\":{}},\\"product\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"车抵贷\\",\\"productType\\":\\"抵押贷\\",\\"minRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"maxRate\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[1200000]},\\"minAmount\\":{\\"s\\":1,\\"e\\":4,\\"d\\":[10000]},\\"maxAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[500000]},\\"minTerm\\":6,\\"maxTerm\\":36,\\"repaymentMethod\\":\\"等额本息\\",\\"minAge\\":null,\\"maxAge\\":null,\\"maxCarAge\\":null,\\"maxMileage\\":null,\\"ltvLimit\\":null,\\"minDownPayment\\":null,\\"regions\\":null,\\"applicableFunders\\":null,\\"accessConditions\\":null,\\"valuationDiscountRate\\":null,\\"status\\":\\"ACTIVE\\",\\"fileChecklist\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"funder\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"平安银行\\",\\"code\\":\\"PABANK\\",\\"funderType\\":\\"BANK\\",\\"contactName\\":null,\\"contactPhone\\":null,\\"integrationMode\\":\\"MANUAL\\",\\"creditLimit\\":null,\\"apiConfig\\":null,\\"appro", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:00.407	\N
59	\N	3	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 24ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 1, "current": 1, "records": [{"id": 1, "code": "1", "name": "瞬力矩阵", "_count": {"funders": 1, "products": 1, "customers": 1, "departments": 0, "applications": 2}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:01.409	\N
60	\N	3	Super	application	GET	GET /saas/api/application/list?current=1&size=20 200 31ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"customerId\\":1,\\"productId\\":1,\\"funderId\\":1,\\"applicationNo\\":\\"SO20260612003\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[150000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[600000]},\\"repaymentMethod\\":\\"等额本息\\",\\"purpose\\":\\"车辆抵押贷款\\",\\"status\\":\\"PENDING_RISK_PRE\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1200,\\"currentStatus\\":20,\\"creatorId\\":3,\\"sourceLeadId\\":null,\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"customer\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"idCard\\":null,\\"gender\\":\\"MALE\\",\\"birthDate\\":null,\\"nation\\":null,\\"householdAddress\\":null,\\"issuingAuthority\\":null,\\"idCardValidFrom\\":null,\\"idCardValidTo\\":null,\\"idCardFront\\":null,\\"idCardBack\\":null,\\"maritalStatus\\":null,\\"education\\":null,\\"occupation\\":null,\\"companyName\\":null,\\"monthlyIncome\\":null,\\"address\\":null,\\"emergencyName\\":null,\\"emergencyPhone\\":null,\\"status\\":\\"ACTIVE\\",\\"createdAt\\":{},\\"updatedAt\\":{}},\\"product\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"车抵贷\\",\\"productType\\":\\"抵押贷\\",\\"minRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"maxRate\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[1200000]},\\"minAmount\\":{\\"s\\":1,\\"e\\":4,\\"d\\":[10000]},\\"maxAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[500000]},\\"minTerm\\":6,\\"maxTerm\\":36,\\"repaymentMethod\\":\\"等额本息\\",\\"minAge\\":null,\\"maxAge\\":null,\\"maxCarAge\\":null,\\"maxMileage\\":null,\\"ltvLimit\\":null,\\"minDownPayment\\":null,\\"regions\\":null,\\"applicableFunders\\":null,\\"accessConditions\\":null,\\"valuationDiscountRate\\":null,\\"status\\":\\"ACTIVE\\",\\"fileChecklist\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"funder\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"平安银行\\",\\"code\\":\\"PABANK\\",\\"funderType\\":\\"BANK\\",\\"contactName\\":null,\\"contactPhone\\":null,\\"integrationMode\\":\\"MANUAL\\",\\"creditLimit\\":null,\\"apiConfig\\":null,\\"appro", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:01.418	\N
61	\N	3	Super	application	GET	GET /saas/api/application/list?current=1&size=20 200 9ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"customerId\\":1,\\"productId\\":1,\\"funderId\\":1,\\"applicationNo\\":\\"SO20260612003\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[150000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[600000]},\\"repaymentMethod\\":\\"等额本息\\",\\"purpose\\":\\"车辆抵押贷款\\",\\"status\\":\\"PENDING_RISK_PRE\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1200,\\"currentStatus\\":20,\\"creatorId\\":3,\\"sourceLeadId\\":null,\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"customer\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"idCard\\":null,\\"gender\\":\\"MALE\\",\\"birthDate\\":null,\\"nation\\":null,\\"householdAddress\\":null,\\"issuingAuthority\\":null,\\"idCardValidFrom\\":null,\\"idCardValidTo\\":null,\\"idCardFront\\":null,\\"idCardBack\\":null,\\"maritalStatus\\":null,\\"education\\":null,\\"occupation\\":null,\\"companyName\\":null,\\"monthlyIncome\\":null,\\"address\\":null,\\"emergencyName\\":null,\\"emergencyPhone\\":null,\\"status\\":\\"ACTIVE\\",\\"createdAt\\":{},\\"updatedAt\\":{}},\\"product\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"车抵贷\\",\\"productType\\":\\"抵押贷\\",\\"minRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"maxRate\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[1200000]},\\"minAmount\\":{\\"s\\":1,\\"e\\":4,\\"d\\":[10000]},\\"maxAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[500000]},\\"minTerm\\":6,\\"maxTerm\\":36,\\"repaymentMethod\\":\\"等额本息\\",\\"minAge\\":null,\\"maxAge\\":null,\\"maxCarAge\\":null,\\"maxMileage\\":null,\\"ltvLimit\\":null,\\"minDownPayment\\":null,\\"regions\\":null,\\"applicableFunders\\":null,\\"accessConditions\\":null,\\"valuationDiscountRate\\":null,\\"status\\":\\"ACTIVE\\",\\"fileChecklist\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"funder\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"平安银行\\",\\"code\\":\\"PABANK\\",\\"funderType\\":\\"BANK\\",\\"contactName\\":null,\\"contactPhone\\":null,\\"integrationMode\\":\\"MANUAL\\",\\"creditLimit\\":null,\\"apiConfig\\":null,\\"appro", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:01.467	\N
62	\N	3	Super	org	GET	GET /saas/api/org/list?current=1&size=20 200 10ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 1, "current": 1, "records": [{"id": 1, "code": "1", "name": "瞬力矩阵", "_count": {"funders": 1, "products": 1, "customers": 1, "departments": 0, "applications": 2}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:02.445	\N
63	\N	3	Super	org	GET	GET /saas/api/org/list?current=1&size=20 200 8ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 1, "current": 1, "records": [{"id": 1, "code": "1", "name": "瞬力矩阵", "_count": {"funders": 1, "products": 1, "customers": 1, "departments": 0, "applications": 2}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:02.508	\N
64	\N	3	Super	org	GET	GET /saas/api/org/list?current=1&size=20 200 10ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 1, "current": 1, "records": [{"id": 1, "code": "1", "name": "瞬力矩阵", "_count": {"funders": 1, "products": 1, "customers": 1, "departments": 0, "applications": 2}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:02.542	\N
65	\N	3	Super	org	GET	GET /saas/api/org/list?current=1&size=20 200 9ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 1, "current": 1, "records": [{"id": 1, "code": "1", "name": "瞬力矩阵", "_count": {"funders": 1, "products": 1, "customers": 1, "departments": 0, "applications": 2}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:02.578	\N
66	\N	3	Super	org	GET	GET /saas/api/org/list?current=1&size=20 200 7ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 1, "current": 1, "records": [{"id": 1, "code": "1", "name": "瞬力矩阵", "_count": {"funders": 1, "products": 1, "customers": 1, "departments": 0, "applications": 2}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:02.61	\N
67	\N	3	Super	org	GET	GET /saas/api/org/list?current=1&size=20 200 7ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 1, "current": 1, "records": [{"id": 1, "code": "1", "name": "瞬力矩阵", "_count": {"funders": 1, "products": 1, "customers": 1, "departments": 0, "applications": 2}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:02.644	\N
68	\N	3	Super	org	GET	GET /saas/api/org/list?current=1&size=20 200 5ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 1, "current": 1, "records": [{"id": 1, "code": "1", "name": "瞬力矩阵", "_count": {"funders": 1, "products": 1, "customers": 1, "departments": 0, "applications": 2}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:02.693	\N
69	\N	3	Super	org	GET	GET /saas/api/org/list?current=1&size=20 200 10ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 1, "current": 1, "records": [{"id": 1, "code": "1", "name": "瞬力矩阵", "_count": {"funders": 1, "products": 1, "customers": 1, "departments": 0, "applications": 2}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:02.731	\N
70	\N	3	Super	dept	GET	GET /saas/api/dept/list?current=1&size=20 200 12ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:05.864	\N
71	\N	3	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 15ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 1, "current": 1, "records": [{"id": 1, "code": "1", "name": "瞬力矩阵", "_count": {"funders": 1, "products": 1, "customers": 1, "departments": 0, "applications": 2}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:05.874	\N
72	\N	3	Super	dept	GET	GET /saas/api/dept/list?current=1&size=20 200 5ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:05.899	\N
73	\N	3	Super	dept	GET	GET /saas/api/dept/list?current=1&size=20 200 5ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:05.932	\N
74	\N	3	Super	dept	GET	GET /saas/api/dept/list?current=1&size=20 200 4ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:05.963	\N
75	\N	3	Super	dept	GET	GET /saas/api/dept/list?current=1&size=20 200 4ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:05.996	\N
76	\N	3	Super	dept	GET	GET /saas/api/dept/list?current=1&size=20 200 5ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:06.028	\N
77	\N	3	Super	dept	GET	GET /saas/api/dept/list?current=1&size=20 200 4ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:06.06	\N
78	\N	3	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 8ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 1, "current": 1, "records": [{"id": 1, "code": "1", "name": "瞬力矩阵", "_count": {"funders": 1, "products": 1, "customers": 1, "departments": 0, "applications": 2}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:06.079	\N
79	\N	3	Super	dept	GET	GET /saas/api/dept/list?current=1&size=20 200 5ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:06.097	\N
80	\N	3	Super	dept	GET	GET /saas/api/dept/list?current=1&size=20 200 4ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:06.13	\N
105	\N	3	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 8ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 1, "current": 1, "records": [{"id": 1, "code": "1", "name": "瞬力矩阵", "_count": {"funders": 1, "products": 1, "customers": 1, "departments": 0, "applications": 2}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:11.679	\N
106	\N	3	Super	flow-config	GET	GET /saas/api/flow-config/list?current=1&size=200&orgId=1&businessType=CAR_LOAN&status= 200 9ms	{"body": {}, "query": {"size": "200", "orgId": "1", "status": "", "current": "1", "businessType": "CAR_LOAN"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":16,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"资方放款-资方放款\\",\\"businessType\\":\\"CAR_LOAN\\",\\"nodeCode\\":\\"9000\\",\\"nodeName\\":\\"资方放款\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":false,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":9000,\\"nodeCode\\":9000,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":9000,\\"phaseName\\":\\"资方放款\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}}},{\\"id\\":15,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"资方终审-资方终审\\",\\"businessType\\":\\"CAR_LOAN\\",\\"nodeCode\\":\\"8000\\",\\"nodeName\\":\\"资方终审\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":true,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":8000,\\"nodeCode\\":8000,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":8000,\\"phaseName\\":\\"资方终审\\",\\"transitions\\":[{\\"action\\":20,\\"toNode\\":9000}],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}}},{\\"id\\":14,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"请款资料-请款资料\\",\\"businessType\\":\\"CAR_LOAN\\",\\"nodeCode\\":\\"7000\\",\\"nodeName\\":\\"请款资料\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":true,\\"requireApproval\\":false,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":7000,\\"nodeCode\\":7000,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":7000,\\"phaseName\\":\\"请款资料\\",\\"transitions\\":[{\\"action\\":10,\\"toNode\\":8000}],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contact", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:12.282	\N
81	\N	3	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 33ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 1, "current": 1, "records": [{"id": 1, "code": "1", "name": "瞬力矩阵", "_count": {"funders": 1, "products": 1, "customers": 1, "departments": 0, "applications": 2}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:07.596	\N
82	\N	3	Super	funder	GET	GET /saas/api/funder/list?current=1&size=20 200 7ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 1, "current": 1, "records": [{"id": 1, "org": {"id": 1, "code": "1", "name": "瞬力矩阵", "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, "code": "PABANK", "name": "平安银行", "orgId": 1, "status": "ACTIVE", "priority": 10, "tenantId": 1, "apiConfig": null, "createdAt": {}, "updatedAt": {}, "funderType": "BANK", "contactName": null, "creditLimit": null, "contactPhone": null, "approvalRules": null, "integrationMode": "MANUAL"}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:08.801	\N
83	\N	3	Super	funder	GET	GET /saas/api/funder/list?current=1&size=20 200 5ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 1, "current": 1, "records": [{"id": 1, "org": {"id": 1, "code": "1", "name": "瞬力矩阵", "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, "code": "PABANK", "name": "平安银行", "orgId": 1, "status": "ACTIVE", "priority": 10, "tenantId": 1, "apiConfig": null, "createdAt": {}, "updatedAt": {}, "funderType": "BANK", "contactName": null, "creditLimit": null, "contactPhone": null, "approvalRules": null, "integrationMode": "MANUAL"}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:08.839	\N
84	\N	3	Super	funder	GET	GET /saas/api/funder/list?current=1&size=20 200 7ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 1, "current": 1, "records": [{"id": 1, "org": {"id": 1, "code": "1", "name": "瞬力矩阵", "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, "code": "PABANK", "name": "平安银行", "orgId": 1, "status": "ACTIVE", "priority": 10, "tenantId": 1, "apiConfig": null, "createdAt": {}, "updatedAt": {}, "funderType": "BANK", "contactName": null, "creditLimit": null, "contactPhone": null, "approvalRules": null, "integrationMode": "MANUAL"}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:08.872	\N
85	\N	3	Super	funder	GET	GET /saas/api/funder/list?current=1&size=20 200 5ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 1, "current": 1, "records": [{"id": 1, "org": {"id": 1, "code": "1", "name": "瞬力矩阵", "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, "code": "PABANK", "name": "平安银行", "orgId": 1, "status": "ACTIVE", "priority": 10, "tenantId": 1, "apiConfig": null, "createdAt": {}, "updatedAt": {}, "funderType": "BANK", "contactName": null, "creditLimit": null, "contactPhone": null, "approvalRules": null, "integrationMode": "MANUAL"}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:08.904	\N
86	\N	3	Super	funder	GET	GET /saas/api/funder/list?current=1&size=20 200 6ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 1, "current": 1, "records": [{"id": 1, "org": {"id": 1, "code": "1", "name": "瞬力矩阵", "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, "code": "PABANK", "name": "平安银行", "orgId": 1, "status": "ACTIVE", "priority": 10, "tenantId": 1, "apiConfig": null, "createdAt": {}, "updatedAt": {}, "funderType": "BANK", "contactName": null, "creditLimit": null, "contactPhone": null, "approvalRules": null, "integrationMode": "MANUAL"}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:08.94	\N
87	\N	3	Super	funder	GET	GET /saas/api/funder/list?current=1&size=20 200 7ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 1, "current": 1, "records": [{"id": 1, "org": {"id": 1, "code": "1", "name": "瞬力矩阵", "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, "code": "PABANK", "name": "平安银行", "orgId": 1, "status": "ACTIVE", "priority": 10, "tenantId": 1, "apiConfig": null, "createdAt": {}, "updatedAt": {}, "funderType": "BANK", "contactName": null, "creditLimit": null, "contactPhone": null, "approvalRules": null, "integrationMode": "MANUAL"}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:08.975	\N
88	\N	3	Super	funder	GET	GET /saas/api/funder/list?current=1&size=20 200 6ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 1, "current": 1, "records": [{"id": 1, "org": {"id": 1, "code": "1", "name": "瞬力矩阵", "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, "code": "PABANK", "name": "平安银行", "orgId": 1, "status": "ACTIVE", "priority": 10, "tenantId": 1, "apiConfig": null, "createdAt": {}, "updatedAt": {}, "funderType": "BANK", "contactName": null, "creditLimit": null, "contactPhone": null, "approvalRules": null, "integrationMode": "MANUAL"}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:09.011	\N
89	\N	3	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 8ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 1, "current": 1, "records": [{"id": 1, "code": "1", "name": "瞬力矩阵", "_count": {"funders": 1, "products": 1, "customers": 1, "departments": 0, "applications": 2}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:09.028	\N
90	\N	3	Super	funder	GET	GET /saas/api/funder/list?current=1&size=20 200 5ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 1, "current": 1, "records": [{"id": 1, "org": {"id": 1, "code": "1", "name": "瞬力矩阵", "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, "code": "PABANK", "name": "平安银行", "orgId": 1, "status": "ACTIVE", "priority": 10, "tenantId": 1, "apiConfig": null, "createdAt": {}, "updatedAt": {}, "funderType": "BANK", "contactName": null, "creditLimit": null, "contactPhone": null, "approvalRules": null, "integrationMode": "MANUAL"}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:09.044	\N
91	\N	3	Super	funder	GET	GET /saas/api/funder/list?current=1&size=20 200 6ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 1, "current": 1, "records": [{"id": 1, "org": {"id": 1, "code": "1", "name": "瞬力矩阵", "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, "code": "PABANK", "name": "平安银行", "orgId": 1, "status": "ACTIVE", "priority": 10, "tenantId": 1, "apiConfig": null, "createdAt": {}, "updatedAt": {}, "funderType": "BANK", "contactName": null, "creditLimit": null, "contactPhone": null, "approvalRules": null, "integrationMode": "MANUAL"}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:09.082	\N
92	\N	3	Super	funder	GET	GET /saas/api/funder/list?current=1&size=20 200 7ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 1, "current": 1, "records": [{"id": 1, "org": {"id": 1, "code": "1", "name": "瞬力矩阵", "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, "code": "PABANK", "name": "平安银行", "orgId": 1, "status": "ACTIVE", "priority": 10, "tenantId": 1, "apiConfig": null, "createdAt": {}, "updatedAt": {}, "funderType": "BANK", "contactName": null, "creditLimit": null, "contactPhone": null, "approvalRules": null, "integrationMode": "MANUAL"}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:09.115	\N
93	\N	3	Super	funder	GET	GET /saas/api/funder/list?current=1&size=20 200 5ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 1, "current": 1, "records": [{"id": 1, "org": {"id": 1, "code": "1", "name": "瞬力矩阵", "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, "code": "PABANK", "name": "平安银行", "orgId": 1, "status": "ACTIVE", "priority": 10, "tenantId": 1, "apiConfig": null, "createdAt": {}, "updatedAt": {}, "funderType": "BANK", "contactName": null, "creditLimit": null, "contactPhone": null, "approvalRules": null, "integrationMode": "MANUAL"}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:09.148	\N
94	\N	3	Super	flow-config	GET	GET /saas/api/flow-config/list?current=1&size=20 200 10ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":34,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"结束\\",\\"businessType\\":\\"PAWN\\",\\"nodeCode\\":\\"2\\",\\"nodeName\\":\\"结束\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":true,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":2,\\"nodeCode\\":2,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":2,\\"phaseName\\":\\"结束\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}}},{\\"id\\":33,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"开始\\",\\"businessType\\":\\"PAWN\\",\\"nodeCode\\":\\"1\\",\\"nodeName\\":\\"开始\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":true,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":1,\\"nodeCode\\":1,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":1,\\"phaseName\\":\\"1\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}}},{\\"id\\":16,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"资方放款-资方放款\\",\\"businessType\\":\\"CAR_LOAN\\",\\"nodeCode\\":\\"9000\\",\\"nodeName\\":\\"资方放款\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":false,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":9000,\\"nodeCode\\":9000,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":9000,\\"phaseName\\":\\"资方放款\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"crea", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:10.946	\N
119	\N	3	Super	m	GET	GET /saas/api/m/statistics/overview 200 1ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-14 01:59:38.707	\N
95	\N	3	Super	flow-config	GET	GET /saas/api/flow-config/list?current=1&size=20 200 8ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":34,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"结束\\",\\"businessType\\":\\"PAWN\\",\\"nodeCode\\":\\"2\\",\\"nodeName\\":\\"结束\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":true,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":2,\\"nodeCode\\":2,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":2,\\"phaseName\\":\\"结束\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}}},{\\"id\\":33,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"开始\\",\\"businessType\\":\\"PAWN\\",\\"nodeCode\\":\\"1\\",\\"nodeName\\":\\"开始\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":true,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":1,\\"nodeCode\\":1,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":1,\\"phaseName\\":\\"1\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}}},{\\"id\\":16,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"资方放款-资方放款\\",\\"businessType\\":\\"CAR_LOAN\\",\\"nodeCode\\":\\"9000\\",\\"nodeName\\":\\"资方放款\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":false,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":9000,\\"nodeCode\\":9000,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":9000,\\"phaseName\\":\\"资方放款\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"crea", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:10.991	\N
96	\N	3	Super	flow-config	GET	GET /saas/api/flow-config/list?current=1&size=20 200 7ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":34,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"结束\\",\\"businessType\\":\\"PAWN\\",\\"nodeCode\\":\\"2\\",\\"nodeName\\":\\"结束\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":true,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":2,\\"nodeCode\\":2,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":2,\\"phaseName\\":\\"结束\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}}},{\\"id\\":33,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"开始\\",\\"businessType\\":\\"PAWN\\",\\"nodeCode\\":\\"1\\",\\"nodeName\\":\\"开始\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":true,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":1,\\"nodeCode\\":1,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":1,\\"phaseName\\":\\"1\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}}},{\\"id\\":16,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"资方放款-资方放款\\",\\"businessType\\":\\"CAR_LOAN\\",\\"nodeCode\\":\\"9000\\",\\"nodeName\\":\\"资方放款\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":false,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":9000,\\"nodeCode\\":9000,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":9000,\\"phaseName\\":\\"资方放款\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"crea", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:11.032	\N
97	\N	3	Super	flow-config	GET	GET /saas/api/flow-config/list?current=1&size=20 200 10ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":34,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"结束\\",\\"businessType\\":\\"PAWN\\",\\"nodeCode\\":\\"2\\",\\"nodeName\\":\\"结束\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":true,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":2,\\"nodeCode\\":2,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":2,\\"phaseName\\":\\"结束\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}}},{\\"id\\":33,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"开始\\",\\"businessType\\":\\"PAWN\\",\\"nodeCode\\":\\"1\\",\\"nodeName\\":\\"开始\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":true,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":1,\\"nodeCode\\":1,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":1,\\"phaseName\\":\\"1\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}}},{\\"id\\":16,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"资方放款-资方放款\\",\\"businessType\\":\\"CAR_LOAN\\",\\"nodeCode\\":\\"9000\\",\\"nodeName\\":\\"资方放款\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":false,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":9000,\\"nodeCode\\":9000,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":9000,\\"phaseName\\":\\"资方放款\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"crea", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:11.071	\N
98	\N	3	Super	flow-config	GET	GET /saas/api/flow-config/list?current=1&size=20 200 7ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":34,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"结束\\",\\"businessType\\":\\"PAWN\\",\\"nodeCode\\":\\"2\\",\\"nodeName\\":\\"结束\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":true,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":2,\\"nodeCode\\":2,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":2,\\"phaseName\\":\\"结束\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}}},{\\"id\\":33,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"开始\\",\\"businessType\\":\\"PAWN\\",\\"nodeCode\\":\\"1\\",\\"nodeName\\":\\"开始\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":true,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":1,\\"nodeCode\\":1,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":1,\\"phaseName\\":\\"1\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}}},{\\"id\\":16,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"资方放款-资方放款\\",\\"businessType\\":\\"CAR_LOAN\\",\\"nodeCode\\":\\"9000\\",\\"nodeName\\":\\"资方放款\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":false,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":9000,\\"nodeCode\\":9000,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":9000,\\"phaseName\\":\\"资方放款\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"crea", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:11.109	\N
99	\N	3	Super	flow-config	GET	GET /saas/api/flow-config/list?current=1&size=20 200 8ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":34,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"结束\\",\\"businessType\\":\\"PAWN\\",\\"nodeCode\\":\\"2\\",\\"nodeName\\":\\"结束\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":true,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":2,\\"nodeCode\\":2,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":2,\\"phaseName\\":\\"结束\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}}},{\\"id\\":33,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"开始\\",\\"businessType\\":\\"PAWN\\",\\"nodeCode\\":\\"1\\",\\"nodeName\\":\\"开始\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":true,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":1,\\"nodeCode\\":1,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":1,\\"phaseName\\":\\"1\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}}},{\\"id\\":16,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"资方放款-资方放款\\",\\"businessType\\":\\"CAR_LOAN\\",\\"nodeCode\\":\\"9000\\",\\"nodeName\\":\\"资方放款\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":false,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":9000,\\"nodeCode\\":9000,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":9000,\\"phaseName\\":\\"资方放款\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"crea", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:11.146	\N
100	\N	3	Super	flow-config	GET	GET /saas/api/flow-config/list?current=1&size=20 200 10ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":34,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"结束\\",\\"businessType\\":\\"PAWN\\",\\"nodeCode\\":\\"2\\",\\"nodeName\\":\\"结束\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":true,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":2,\\"nodeCode\\":2,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":2,\\"phaseName\\":\\"结束\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}}},{\\"id\\":33,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"开始\\",\\"businessType\\":\\"PAWN\\",\\"nodeCode\\":\\"1\\",\\"nodeName\\":\\"开始\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":true,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":1,\\"nodeCode\\":1,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":1,\\"phaseName\\":\\"1\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}}},{\\"id\\":16,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"资方放款-资方放款\\",\\"businessType\\":\\"CAR_LOAN\\",\\"nodeCode\\":\\"9000\\",\\"nodeName\\":\\"资方放款\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":false,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":9000,\\"nodeCode\\":9000,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":9000,\\"phaseName\\":\\"资方放款\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"crea", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:11.21	\N
101	\N	3	Super	flow-config	GET	GET /saas/api/flow-config/list?current=1&size=20 200 10ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":34,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"结束\\",\\"businessType\\":\\"PAWN\\",\\"nodeCode\\":\\"2\\",\\"nodeName\\":\\"结束\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":true,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":2,\\"nodeCode\\":2,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":2,\\"phaseName\\":\\"结束\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}}},{\\"id\\":33,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"开始\\",\\"businessType\\":\\"PAWN\\",\\"nodeCode\\":\\"1\\",\\"nodeName\\":\\"开始\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":true,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":1,\\"nodeCode\\":1,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":1,\\"phaseName\\":\\"1\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}}},{\\"id\\":16,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"资方放款-资方放款\\",\\"businessType\\":\\"CAR_LOAN\\",\\"nodeCode\\":\\"9000\\",\\"nodeName\\":\\"资方放款\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":false,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":9000,\\"nodeCode\\":9000,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":9000,\\"phaseName\\":\\"资方放款\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"crea", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:11.249	\N
102	\N	3	Super	flow-config	GET	GET /saas/api/flow-config/list?current=1&size=20 200 6ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":34,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"结束\\",\\"businessType\\":\\"PAWN\\",\\"nodeCode\\":\\"2\\",\\"nodeName\\":\\"结束\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":true,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":2,\\"nodeCode\\":2,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":2,\\"phaseName\\":\\"结束\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}}},{\\"id\\":33,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"开始\\",\\"businessType\\":\\"PAWN\\",\\"nodeCode\\":\\"1\\",\\"nodeName\\":\\"开始\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":true,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":1,\\"nodeCode\\":1,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":1,\\"phaseName\\":\\"1\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}}},{\\"id\\":16,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"资方放款-资方放款\\",\\"businessType\\":\\"CAR_LOAN\\",\\"nodeCode\\":\\"9000\\",\\"nodeName\\":\\"资方放款\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":false,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":9000,\\"nodeCode\\":9000,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":9000,\\"phaseName\\":\\"资方放款\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"crea", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:11.285	\N
103	\N	3	Super	flow-config	GET	GET /saas/api/flow-config/list?current=1&size=20 200 6ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":34,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"结束\\",\\"businessType\\":\\"PAWN\\",\\"nodeCode\\":\\"2\\",\\"nodeName\\":\\"结束\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":true,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":2,\\"nodeCode\\":2,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":2,\\"phaseName\\":\\"结束\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}}},{\\"id\\":33,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"开始\\",\\"businessType\\":\\"PAWN\\",\\"nodeCode\\":\\"1\\",\\"nodeName\\":\\"开始\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":true,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":1,\\"nodeCode\\":1,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":1,\\"phaseName\\":\\"1\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}}},{\\"id\\":16,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"资方放款-资方放款\\",\\"businessType\\":\\"CAR_LOAN\\",\\"nodeCode\\":\\"9000\\",\\"nodeName\\":\\"资方放款\\",\\"approveLevel\\":1,\\"amountLimit\\":null,\\"timeoutHours\\":null,\\"requireMaterials\\":false,\\"requireApproval\\":false,\\"autoPass\\":false,\\"ruleConfig\\":{\\"sort\\":9000,\\"nodeCode\\":9000,\\"parallel\\":false,\\"required\\":false,\\"phaseCode\\":9000,\\"phaseName\\":\\"资方放款\\",\\"transitions\\":[],\\"initialStatus\\":10},\\"status\\":\\"ACTIVE\\",\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"crea", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:11.319	\N
104	\N	3	Super	flow-config	GET	GET /saas/api/flow-config/meta 200 1ms	{"body": {}, "query": {}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"businessTypes\\":[{\\"label\\":\\"车贷\\",\\"value\\":\\"CAR_LOAN\\"},{\\"label\\":\\"融资租赁\\",\\"value\\":\\"LEASE\\"},{\\"label\\":\\"典当\\",\\"value\\":\\"PAWN\\"}],\\"actions\\":[{\\"label\\":\\"提交\\",\\"value\\":10,\\"code\\":\\"SUBMIT\\"},{\\"label\\":\\"通过\\",\\"value\\":20,\\"code\\":\\"PASS\\"},{\\"label\\":\\"拒绝\\",\\"value\\":30,\\"code\\":\\"REJECT\\"},{\\"label\\":\\"退回\\",\\"value\\":40,\\"code\\":\\"RETURN\\"},{\\"label\\":\\"要求补充\\",\\"value\\":50,\\"code\\":\\"SUPPLEMENT\\"},{\\"label\\":\\"取消\\",\\"value\\":60,\\"code\\":\\"CANCEL\\"}],\\"statuses\\":[{\\"label\\":\\"未开始\\",\\"value\\":0,\\"code\\":\\"WAITING\\"},{\\"label\\":\\"处理中\\",\\"value\\":10,\\"code\\":\\"PROCESSING\\"},{\\"label\\":\\"已通过\\",\\"value\\":20,\\"code\\":\\"PASSED\\"},{\\"label\\":\\"已拒绝\\",\\"value\\":30,\\"code\\":\\"REJECTED\\"},{\\"label\\":\\"已退回\\",\\"value\\":40,\\"code\\":\\"RETURNED\\"},{\\"label\\":\\"待补充\\",\\"value\\":50,\\"code\\":\\"SUPPLEMENTING\\"},{\\"label\\":\\"已完成\\",\\"value\\":90,\\"code\\":\\"COMPLETED\\"}],\\"nodes\\":[{\\"code\\":1100,\\"name\\":\\"预审进件\\",\\"phaseCode\\":1000,\\"phaseName\\":\\"预审阶段\\",\\"sort\\":1100,\\"operationSide\\":\\"移动端\\",\\"executor\\":\\"客户/业务员\\",\\"parallel\\":false,\\"required\\":false,\\"steps\\":[{\\"code\\":\\"ID_CARD\\",\\"name\\":\\"身份证信息\\",\\"operationSide\\":\\"移动端\\",\\"executor\\":\\"客户/业务员\\",\\"sort\\":1110,\\"required\\":true},{\\"code\\":\\"VEHICLE\\",\\"name\\":\\"车辆信息\\",\\"operationSide\\":\\"移动端\\",\\"executor\\":\\"客户/业务员\\",\\"sort\\":1120,\\"required\\":true},{\\"code\\":\\"APPLICATION\\",\\"name\\":\\"申请信息\\",\\"operationSide\\":\\"移动端\\",\\"executor\\":\\"客户/业务员\\",\\"sort\\":1130,\\"required\\":true},{\\"code\\":\\"AUTH_SIGN\\",\\"name\\":\\"签署授权书\\",\\"operationSide\\":\\"移动端\\",\\"executor\\":\\"客户/业务员\\",\\"sort\\":1140,\\"required\\":true}],\\"transitions\\":[{\\"action\\":10,\\"toNode\\":1200}]},{\\"code\\":1200,\\"name\\":\\"风控预审\\",\\"phaseCode\\":1000,\\"phaseName\\":\\"预审阶段\\",\\"sort\\":1200,\\"operationSide\\":\\"系统\\",\\"executor\\":\\"系统自动化\\",\\"parallel\\":false,\\"required\\":false,\\"steps\\":[],\\"transitions\\":[{\\"action\\":20,\\"toNode\\":1300}]},{\\"code\\":1300,\\"name\\":\\"资方预审\\",\\"phaseCode\\":1000,\\"phaseName\\":\\"预审阶段\\",\\"sort\\":1300,\\"operationSide\\":\\"三方接口\\",\\"executor\\":\\"资方接口\\",\\"parallel\\":false,\\"required\\":false,\\"steps\\":[],\\"transitions\\":[{\\"action\\":20,\\"toNode\\":1400},{\\"action\\":50,\\"toNode\\":1400}]},{\\"code\\":1400,\\"name\\":\\"资料补充\\",\\"phaseCode\\":1400,\\"phaseName\\":\\"补件阶段\\",\\"sort\\":1400,\\"operationSide\\":\\"移动端\\",\\"executor\\":\\"客户\\",\\"parallel\\":false,\\"required\\":false,\\"steps\\":[{\\"code\\":\\"CUSTOMER_I", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-13 18:32:11.665	\N
107	\N	\N	\N	auth	POST	POST /saas/api/auth/login 400 6ms	{"body": {"password": "***", "userName": "Super"}, "query": {}, "params": {}}	{"error": "Bad Request", "message": "X-Tenant-ID header is required", "statusCode": 400}	172.18.0.1	curl/8.7.1	2026-06-14 01:33:17.655	\N
108	\N	\N	\N	auth	POST	POST /saas/api/auth/login 200 131ms	{"body": {"password": "***", "userName": "Super"}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"token": "***", "refreshToken": "***"}}	172.18.0.1	curl/8.7.1	2026-06-14 01:33:26.403	\N
109	\N	3	Super	dict	GET	GET /saas/api/dict/options/test 200 24ms	{"body": {}, "query": {}, "params": {"code": "test"}}	{"msg": "success", "code": 200, "data": []}	172.18.0.1	curl/8.7.1	2026-06-14 01:42:06.317	\N
110	\N	3	Super	dict	GET	GET /saas/api/dict/options/loan_purpose 200 8ms	{"body": {}, "query": {}, "params": {"code": "loan_purpose"}}	{"msg": "success", "code": 200, "data": []}	172.18.0.1	curl/8.7.1	2026-06-14 01:46:33.785	\N
111	\N	\N	\N	auth	POST	POST /saas/api/auth/login 200 316ms	{"body": {"password": "***", "userName": "Super"}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"token": "***", "refreshToken": "***"}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-14 01:55:32.49	\N
112	\N	3	Super	user	GET	GET /saas/api/user/info 200 9ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"email": "super@example.com", "roles": ["R_SUPER"], "avatar": null, "userId": 3, "buttons": ["add"], "userName": "Super"}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-14 01:55:32.532	\N
113	\N	3	Super	v3	GET	GET /saas/api/v3/system/menus 200 29ms	{"body": {}, "query": {}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":[{\\"id\\":1,\\"parentId\\":null,\\"path\\":\\"/dashboard\\",\\"name\\":\\"Dashboard\\",\\"component\\":\\"/index/index\\",\\"meta\\":{\\"title\\":\\"仪表盘\\",\\"icon\\":\\"ri:dashboard-line\\",\\"sort\\":10,\\"keepAlive\\":false,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]},\\"children\\":[{\\"id\\":2,\\"parentId\\":1,\\"path\\":\\"console\\",\\"name\\":\\"Console\\",\\"component\\":\\"/dashboard/console\\",\\"meta\\":{\\"title\\":\\"工作台\\",\\"icon\\":\\"ri:computer-line\\",\\"sort\\":11,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]}},{\\"id\\":3,\\"parentId\\":1,\\"path\\":\\"analysis\\",\\"name\\":\\"Analysis\\",\\"component\\":\\"/dashboard/analysis\\",\\"meta\\":{\\"title\\":\\"分析页\\",\\"icon\\":\\"ri:line-chart-line\\",\\"sort\\":12,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]}}]},{\\"id\\":12,\\"parentId\\":null,\\"path\\":\\"/platform\\",\\"name\\":\\"Platform\\",\\"component\\":\\"/index/index\\",\\"meta\\":{\\"title\\":\\"平台管理\\",\\"icon\\":\\"ri:global-line\\",\\"sort\\":20,\\"keepAlive\\":false,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\"],\\"authList\\":[]},\\"children\\":[{\\"id\\":13,\\"parentId\\":12,\\"path\\":\\"tenant\\",\\"name\\":\\"TenantMgmt\\",\\"component\\":\\"/business/common-list\\",\\"meta\\":{\\"title\\":\\"租户机构管理\\",\\"icon\\":\\"ri:building-2-line\\",\\"sort\\":21,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\"],\\"authList\\":[{\\"id\\":4,\\"title\\":\\"Add\\",\\"authMark\\":\\"add\\",\\"roles\\":[]},{\\"id\\":5,\\"title\\":\\"Edit\\",\\"authMark\\":\\"edit\\",\\"roles\\":[]},{\\"id\\":6,\\"title\\":\\"Delete\\",\\"authMark\\":\\"delete\\",\\"roles\\":[]}]}},{\\"id\\":14,\\"parentId\\":12,\\"path\\":\\"package-billing\\",\\"name\\":\\"PackageBilling\\",\\"component\\":\\"", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-14 01:55:32.603	\N
114	\N	\N	\N	auth	POST	POST /saas/api/auth/login 200 107ms	{"body": {"password": "***", "userName": "Super"}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"token": "***", "refreshToken": "***"}}	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-14 01:55:59.161	\N
115	\N	3	Super	user	GET	GET /saas/api/user/info 200 7ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"email": "super@example.com", "roles": ["R_SUPER"], "avatar": null, "userId": 3, "buttons": ["add"], "userName": "Super"}}	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-14 01:55:59.2	\N
116	\N	3	Super	m	GET	GET /saas/api/m/statistics/overview 200 0ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-14 01:55:59.86	\N
117	\N	3	Super	application	GET	GET /saas/api/application/order-list?pageNum=1&pageSize=10 200 28ms	{"body": {}, "query": {"pageNum": "1", "pageSize": "10"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"瞬力矩阵\\",\\"customerId\\":1,\\"uuid\\":\\"1\\",\\"customerName\\":\\"张三\\",\\"personName\\":\\"张三\\",\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"telephone\\":\\"13800138001\\",\\"idCard\\":\\"\\",\\"vehicleId\\":1,\\"plateNumber\\":\\"京A12345\\",\\"vehicleBrand\\":\\"宝马\\",\\"vehicleModel\\":\\"3系\\",\\"vehicleOwner\\":\\"\\",\\"applicationNo\\":\\"SO20260612003\\",\\"orderNo\\":\\"SO20260612003\\",\\"creditOrderId\\":\\"SO20260612003\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[150000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[600000]},\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"status\\":\\"PENDING_RISK_PRE\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1200,\\"nodeCode\\":1200,\\"currentNodeName\\":\\"车辆信息\\",\\"nodeName\\":\\"车辆信息\\",\\"currentStatus\\":20,\\"nodeStatus\\":20,\\"currentStatusName\\":\\"已通过\\",\\"nodeStatusName\\":\\"已通过\\",\\"phaseCode\\":1000,\\"phaseName\\":\\"预审进件\\",\\"productId\\":1,\\"productName\\":\\"车抵贷\\",\\"funderId\\":1,\\"funderName\\":\\"平安银行\\",\\"creatorId\\":3,\\"creatorName\\":\\"Super Admin\\",\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}},{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"瞬力矩阵\\",\\"customerId\\":1,\\"uuid\\":\\"1\\",\\"customerName\\":\\"张三\\",\\"personName\\":\\"张三\\",\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"telephone\\":\\"13800138001\\",\\"idCard\\":\\"\\",\\"vehicleId\\":1,\\"plateNumber\\":\\"京A12345\\",\\"vehicleBrand\\":\\"宝马\\",\\"vehicleModel\\":\\"3系\\",\\"vehicleOwner\\":\\"\\",\\"applicationNo\\":\\"SO20260613001\\",\\"orderNo\\":\\"SO20260613001\\",\\"creditOrderId\\":\\"SO20260613001\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[200000]},\\"term\\":24,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[800000]},\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1100,\\"nodeCode\\":1100,\\"currentNodeName\\":\\"身份证信息\\",\\"nodeName\\":\\"身份证信息\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":1000,\\"phaseName\\":\\"预审进件\\",\\"productId\\":1,\\"productName\\":\\"车抵贷\\",\\"funderId\\":1,\\"funderName\\":\\"平安银行\\",\\"creatorId\\":3,\\"creatorName\\":\\"Super Admin\\",\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}}],\\"current\\":1,\\"size\\":", "truncated": true}	172.18.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-14 01:56:06.825	\N
120	\N	3	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 116ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 1, "current": 1, "records": [{"id": 1, "code": "1", "name": "瞬力矩阵", "_count": {"funders": 1, "products": 1, "customers": 1, "departments": 0, "applications": 2}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-14 02:02:25.371	\N
121	\N	3	Super	application	GET	GET /saas/api/application/list?current=1&size=20 200 112ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"customerId\\":1,\\"productId\\":1,\\"funderId\\":1,\\"applicationNo\\":\\"SO20260612003\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[150000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[600000]},\\"repaymentMethod\\":\\"等额本息\\",\\"purpose\\":\\"车辆抵押贷款\\",\\"status\\":\\"PENDING_RISK_PRE\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1200,\\"currentStatus\\":20,\\"creatorId\\":3,\\"sourceLeadId\\":null,\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"customer\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"idCard\\":null,\\"gender\\":\\"MALE\\",\\"birthDate\\":null,\\"nation\\":null,\\"householdAddress\\":null,\\"issuingAuthority\\":null,\\"idCardValidFrom\\":null,\\"idCardValidTo\\":null,\\"idCardFront\\":null,\\"idCardBack\\":null,\\"maritalStatus\\":null,\\"education\\":null,\\"occupation\\":null,\\"companyName\\":null,\\"monthlyIncome\\":null,\\"address\\":null,\\"emergencyName\\":null,\\"emergencyPhone\\":null,\\"status\\":\\"ACTIVE\\",\\"createdAt\\":{},\\"updatedAt\\":{}},\\"product\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"车抵贷\\",\\"productType\\":\\"抵押贷\\",\\"minRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"maxRate\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[1200000]},\\"minAmount\\":{\\"s\\":1,\\"e\\":4,\\"d\\":[10000]},\\"maxAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[500000]},\\"minTerm\\":6,\\"maxTerm\\":36,\\"repaymentMethod\\":\\"等额本息\\",\\"minAge\\":null,\\"maxAge\\":null,\\"maxCarAge\\":null,\\"maxMileage\\":null,\\"ltvLimit\\":null,\\"minDownPayment\\":null,\\"regions\\":null,\\"applicableFunders\\":null,\\"accessConditions\\":null,\\"valuationDiscountRate\\":null,\\"status\\":\\"ACTIVE\\",\\"fileChecklist\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"funder\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"平安银行\\",\\"code\\":\\"PABANK\\",\\"funderType\\":\\"BANK\\",\\"contactName\\":null,\\"contactPhone\\":null,\\"integrationMode\\":\\"MANUAL\\",\\"creditLimit\\":null,\\"apiConfig\\":null,\\"appro", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-14 02:02:25.366	\N
122	\N	3	Super	application	GET	GET /saas/api/application/list?current=1&size=20 200 17ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"customerId\\":1,\\"productId\\":1,\\"funderId\\":1,\\"applicationNo\\":\\"SO20260612003\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[150000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[600000]},\\"repaymentMethod\\":\\"等额本息\\",\\"purpose\\":\\"车辆抵押贷款\\",\\"status\\":\\"PENDING_RISK_PRE\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1200,\\"currentStatus\\":20,\\"creatorId\\":3,\\"sourceLeadId\\":null,\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"customer\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"idCard\\":null,\\"gender\\":\\"MALE\\",\\"birthDate\\":null,\\"nation\\":null,\\"householdAddress\\":null,\\"issuingAuthority\\":null,\\"idCardValidFrom\\":null,\\"idCardValidTo\\":null,\\"idCardFront\\":null,\\"idCardBack\\":null,\\"maritalStatus\\":null,\\"education\\":null,\\"occupation\\":null,\\"companyName\\":null,\\"monthlyIncome\\":null,\\"address\\":null,\\"emergencyName\\":null,\\"emergencyPhone\\":null,\\"status\\":\\"ACTIVE\\",\\"createdAt\\":{},\\"updatedAt\\":{}},\\"product\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"车抵贷\\",\\"productType\\":\\"抵押贷\\",\\"minRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"maxRate\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[1200000]},\\"minAmount\\":{\\"s\\":1,\\"e\\":4,\\"d\\":[10000]},\\"maxAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[500000]},\\"minTerm\\":6,\\"maxTerm\\":36,\\"repaymentMethod\\":\\"等额本息\\",\\"minAge\\":null,\\"maxAge\\":null,\\"maxCarAge\\":null,\\"maxMileage\\":null,\\"ltvLimit\\":null,\\"minDownPayment\\":null,\\"regions\\":null,\\"applicableFunders\\":null,\\"accessConditions\\":null,\\"valuationDiscountRate\\":null,\\"status\\":\\"ACTIVE\\",\\"fileChecklist\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"funder\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"平安银行\\",\\"code\\":\\"PABANK\\",\\"funderType\\":\\"BANK\\",\\"contactName\\":null,\\"contactPhone\\":null,\\"integrationMode\\":\\"MANUAL\\",\\"creditLimit\\":null,\\"apiConfig\\":null,\\"appro", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-14 02:02:25.411	\N
123	\N	3	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 16ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 1, "current": 1, "records": [{"id": 1, "code": "1", "name": "瞬力矩阵", "_count": {"funders": 1, "products": 1, "customers": 1, "departments": 0, "applications": 2}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}]}}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-14 02:02:26.636	\N
124	\N	3	Super	application	GET	GET /saas/api/application/list?current=1&size=20 200 25ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"customerId\\":1,\\"productId\\":1,\\"funderId\\":1,\\"applicationNo\\":\\"SO20260612003\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[150000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[600000]},\\"repaymentMethod\\":\\"等额本息\\",\\"purpose\\":\\"车辆抵押贷款\\",\\"status\\":\\"PENDING_RISK_PRE\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1200,\\"currentStatus\\":20,\\"creatorId\\":3,\\"sourceLeadId\\":null,\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"customer\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"idCard\\":null,\\"gender\\":\\"MALE\\",\\"birthDate\\":null,\\"nation\\":null,\\"householdAddress\\":null,\\"issuingAuthority\\":null,\\"idCardValidFrom\\":null,\\"idCardValidTo\\":null,\\"idCardFront\\":null,\\"idCardBack\\":null,\\"maritalStatus\\":null,\\"education\\":null,\\"occupation\\":null,\\"companyName\\":null,\\"monthlyIncome\\":null,\\"address\\":null,\\"emergencyName\\":null,\\"emergencyPhone\\":null,\\"status\\":\\"ACTIVE\\",\\"createdAt\\":{},\\"updatedAt\\":{}},\\"product\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"车抵贷\\",\\"productType\\":\\"抵押贷\\",\\"minRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"maxRate\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[1200000]},\\"minAmount\\":{\\"s\\":1,\\"e\\":4,\\"d\\":[10000]},\\"maxAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[500000]},\\"minTerm\\":6,\\"maxTerm\\":36,\\"repaymentMethod\\":\\"等额本息\\",\\"minAge\\":null,\\"maxAge\\":null,\\"maxCarAge\\":null,\\"maxMileage\\":null,\\"ltvLimit\\":null,\\"minDownPayment\\":null,\\"regions\\":null,\\"applicableFunders\\":null,\\"accessConditions\\":null,\\"valuationDiscountRate\\":null,\\"status\\":\\"ACTIVE\\",\\"fileChecklist\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"funder\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"平安银行\\",\\"code\\":\\"PABANK\\",\\"funderType\\":\\"BANK\\",\\"contactName\\":null,\\"contactPhone\\":null,\\"integrationMode\\":\\"MANUAL\\",\\"creditLimit\\":null,\\"apiConfig\\":null,\\"appro", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-14 02:02:26.648	\N
125	\N	3	Super	application	GET	GET /saas/api/application/list?current=1&size=20 200 11ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"customerId\\":1,\\"productId\\":1,\\"funderId\\":1,\\"applicationNo\\":\\"SO20260612003\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[150000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[600000]},\\"repaymentMethod\\":\\"等额本息\\",\\"purpose\\":\\"车辆抵押贷款\\",\\"status\\":\\"PENDING_RISK_PRE\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":1200,\\"currentStatus\\":20,\\"creatorId\\":3,\\"sourceLeadId\\":null,\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"瞬力矩阵\\",\\"code\\":\\"1\\",\\"creditCode\\":null,\\"contactName\\":null,\\"contactPhone\\":null,\\"address\\":null,\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"customer\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"张三\\",\\"phone\\":\\"13800138001\\",\\"idCard\\":null,\\"gender\\":\\"MALE\\",\\"birthDate\\":null,\\"nation\\":null,\\"householdAddress\\":null,\\"issuingAuthority\\":null,\\"idCardValidFrom\\":null,\\"idCardValidTo\\":null,\\"idCardFront\\":null,\\"idCardBack\\":null,\\"maritalStatus\\":null,\\"education\\":null,\\"occupation\\":null,\\"companyName\\":null,\\"monthlyIncome\\":null,\\"address\\":null,\\"emergencyName\\":null,\\"emergencyPhone\\":null,\\"status\\":\\"ACTIVE\\",\\"createdAt\\":{},\\"updatedAt\\":{}},\\"product\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"车抵贷\\",\\"productType\\":\\"抵押贷\\",\\"minRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"maxRate\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[1200000]},\\"minAmount\\":{\\"s\\":1,\\"e\\":4,\\"d\\":[10000]},\\"maxAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[500000]},\\"minTerm\\":6,\\"maxTerm\\":36,\\"repaymentMethod\\":\\"等额本息\\",\\"minAge\\":null,\\"maxAge\\":null,\\"maxCarAge\\":null,\\"maxMileage\\":null,\\"ltvLimit\\":null,\\"minDownPayment\\":null,\\"regions\\":null,\\"applicableFunders\\":null,\\"accessConditions\\":null,\\"valuationDiscountRate\\":null,\\"status\\":\\"ACTIVE\\",\\"fileChecklist\\":null,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"funder\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"平安银行\\",\\"code\\":\\"PABANK\\",\\"funderType\\":\\"BANK\\",\\"contactName\\":null,\\"contactPhone\\":null,\\"integrationMode\\":\\"MANUAL\\",\\"creditLimit\\":null,\\"apiConfig\\":null,\\"appro", "truncated": true}	172.18.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-14 02:02:26.69	\N
\.


--
-- Data for Name: Organization; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."Organization" (id, name, code, "creditCode", "contactName", "contactPhone", address, status, "packageType", "expireAt", "apiEnabled", "createdAt", "updatedAt", "tenantId") FROM stdin;
1	瞬力矩阵	1	\N	\N	\N	\N	ACTIVE	STANDARD	\N	t	2026-06-03 11:38:09.984	2026-06-03 11:38:09.984	1
\.


--
-- Data for Name: Permission; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."Permission" (id, "menuId", title, "authMark", "createdAt", "updatedAt", "tenantId") FROM stdin;
21	18	Delete	delete	2026-06-01 09:43:04.36	2026-06-01 12:00:48.783	1
22	20	Add	add	2026-06-01 09:43:04.363	2026-06-01 12:00:48.785	1
23	20	Edit	edit	2026-06-01 09:43:04.366	2026-06-01 12:00:48.787	1
84	27	Delete	delete	2026-06-01 09:43:04.65	2026-06-01 12:00:48.928	1
85	29	Add	add	2026-06-01 09:43:04.656	2026-06-01 12:00:48.931	1
86	29	Edit	edit	2026-06-01 09:43:04.661	2026-06-01 12:00:48.933	1
12	15	Delete	delete	2026-06-01 09:43:04.336	2026-06-01 12:00:48.756	1
13	16	Add	add	2026-06-01 09:43:04.34	2026-06-01 12:00:48.758	1
14	16	Edit	edit	2026-06-01 09:43:04.343	2026-06-01 12:00:48.762	1
15	16	Delete	delete	2026-06-01 09:43:04.345	2026-06-01 12:00:48.764	1
16	17	Add	add	2026-06-01 09:43:04.348	2026-06-01 12:00:48.767	1
17	17	Edit	edit	2026-06-01 09:43:04.35	2026-06-01 12:00:48.769	1
18	17	Delete	delete	2026-06-01 09:43:04.353	2026-06-01 12:00:48.771	1
19	18	Add	add	2026-06-01 09:43:04.356	2026-06-01 12:00:48.774	1
24	20	Delete	delete	2026-06-01 09:43:04.369	2026-06-01 12:00:48.79	1
25	21	Add	add	2026-06-01 09:43:04.371	2026-06-01 12:00:48.792	1
26	21	Edit	edit	2026-06-01 09:43:04.374	2026-06-01 12:00:48.794	1
27	21	Delete	delete	2026-06-01 09:43:04.376	2026-06-01 12:00:48.797	1
28	34	Add	add	2026-06-01 09:43:04.379	2026-06-01 12:00:48.799	1
29	34	Edit	edit	2026-06-01 09:43:04.381	2026-06-01 12:00:48.801	1
30	34	Delete	delete	2026-06-01 09:43:04.383	2026-06-01 12:00:48.804	1
31	35	Add	add	2026-06-01 09:43:04.386	2026-06-01 12:00:48.806	1
32	35	Edit	edit	2026-06-01 09:43:04.388	2026-06-01 12:00:48.808	1
33	35	Delete	delete	2026-06-01 09:43:04.391	2026-06-01 12:00:48.811	1
34	36	Add	add	2026-06-01 09:43:04.393	2026-06-01 12:00:48.813	1
35	36	Edit	edit	2026-06-01 09:43:04.396	2026-06-01 12:00:48.815	1
36	36	Delete	delete	2026-06-01 09:43:04.398	2026-06-01 12:00:48.817	1
37	37	Add	add	2026-06-01 09:43:04.401	2026-06-01 12:00:48.82	1
38	37	Edit	edit	2026-06-01 09:43:04.406	2026-06-01 12:00:48.822	1
39	37	Delete	delete	2026-06-01 09:43:04.414	2026-06-01 12:00:48.824	1
40	38	Add	add	2026-06-01 09:43:04.419	2026-06-01 12:00:48.826	1
41	38	Edit	edit	2026-06-01 09:43:04.424	2026-06-01 12:00:48.829	1
42	38	Delete	delete	2026-06-01 09:43:04.429	2026-06-01 12:00:48.831	1
43	39	Add	add	2026-06-01 09:43:04.435	2026-06-01 12:00:48.833	1
44	39	Edit	edit	2026-06-01 09:43:04.439	2026-06-01 12:00:48.835	1
45	39	Delete	delete	2026-06-01 09:43:04.445	2026-06-01 12:00:48.838	1
46	40	Add	add	2026-06-01 09:43:04.454	2026-06-01 12:00:48.84	1
47	40	Edit	edit	2026-06-01 09:43:04.458	2026-06-01 12:00:48.842	1
48	40	Delete	delete	2026-06-01 09:43:04.462	2026-06-01 12:00:48.844	1
49	41	Add	add	2026-06-01 09:43:04.468	2026-06-01 12:00:48.847	1
50	41	Edit	edit	2026-06-01 09:43:04.472	2026-06-01 12:00:48.849	1
51	41	Delete	delete	2026-06-01 09:43:04.477	2026-06-01 12:00:48.852	1
52	42	Add	add	2026-06-01 09:43:04.483	2026-06-01 12:00:48.855	1
53	42	Edit	edit	2026-06-01 09:43:04.489	2026-06-01 12:00:48.857	1
54	42	Delete	delete	2026-06-01 09:43:04.493	2026-06-01 12:00:48.859	1
55	43	Add	add	2026-06-01 09:43:04.499	2026-06-01 12:00:48.861	1
56	43	Edit	edit	2026-06-01 09:43:04.504	2026-06-01 12:00:48.864	1
57	43	Delete	delete	2026-06-01 09:43:04.509	2026-06-01 12:00:48.866	1
58	44	Add	add	2026-06-01 09:43:04.514	2026-06-01 12:00:48.868	1
59	44	Edit	edit	2026-06-01 09:43:04.518	2026-06-01 12:00:48.871	1
60	44	Delete	delete	2026-06-01 09:43:04.523	2026-06-01 12:00:48.873	1
61	45	Add	add	2026-06-01 09:43:04.527	2026-06-01 12:00:48.875	1
62	45	Edit	edit	2026-06-01 09:43:04.532	2026-06-01 12:00:48.878	1
63	45	Delete	delete	2026-06-01 09:43:04.536	2026-06-01 12:00:48.88	1
64	46	Add	add	2026-06-01 09:43:04.541	2026-06-01 12:00:48.883	1
65	46	Edit	edit	2026-06-01 09:43:04.545	2026-06-01 12:00:48.885	1
66	46	Delete	delete	2026-06-01 09:43:04.549	2026-06-01 12:00:48.887	1
67	47	Add	add	2026-06-01 09:43:04.554	2026-06-01 12:00:48.889	1
68	47	Edit	edit	2026-06-01 09:43:04.558	2026-06-01 12:00:48.891	1
69	47	Delete	delete	2026-06-01 09:43:04.562	2026-06-01 12:00:48.894	1
70	48	Add	add	2026-06-01 09:43:04.566	2026-06-01 12:00:48.896	1
71	48	Edit	edit	2026-06-01 09:43:04.572	2026-06-01 12:00:48.898	1
72	48	Delete	delete	2026-06-01 09:43:04.579	2026-06-01 12:00:48.9	1
73	49	Add	add	2026-06-01 09:43:04.585	2026-06-01 12:00:48.903	1
74	49	Edit	edit	2026-06-01 09:43:04.589	2026-06-01 12:00:48.906	1
75	49	Delete	delete	2026-06-01 09:43:04.595	2026-06-01 12:00:48.908	1
2	7	Add	add	2026-05-27 01:11:44.552	2026-06-01 12:00:48.91	1
3	7	Edit	edit	2026-05-27 01:11:44.554	2026-06-01 12:00:48.913	1
1	7	Delete	delete	2026-05-27 01:11:44.553	2026-06-01 12:00:48.915	1
79	26	Add	add	2026-06-01 09:43:04.62	2026-06-01 12:00:48.917	1
80	26	Edit	edit	2026-06-01 09:43:04.625	2026-06-01 12:00:48.919	1
81	26	Delete	delete	2026-06-01 09:43:04.632	2026-06-01 12:00:48.921	1
82	27	Add	add	2026-06-01 09:43:04.637	2026-06-01 12:00:48.924	1
83	27	Edit	edit	2026-06-01 09:43:04.645	2026-06-01 12:00:48.926	1
87	29	Delete	delete	2026-06-01 09:43:04.667	2026-06-01 12:00:48.935	1
88	31	Add	add	2026-06-01 09:43:04.674	2026-06-01 12:00:48.938	1
89	31	Edit	edit	2026-06-01 09:43:04.68	2026-06-01 12:00:48.941	1
90	31	Delete	delete	2026-06-01 09:43:04.694	2026-06-01 12:00:48.943	1
265	132	Add	add	2026-06-02 13:34:12.196	2026-06-02 13:34:12.196	1
266	132	Edit	edit	2026-06-02 13:34:12.196	2026-06-02 13:34:12.196	1
4	13	Add	add	2026-06-01 09:43:04.311	2026-06-01 12:00:48.735	1
5	13	Edit	edit	2026-06-01 09:43:04.316	2026-06-01 12:00:48.739	1
6	13	Delete	delete	2026-06-01 09:43:04.319	2026-06-01 12:00:48.741	1
7	14	Add	add	2026-06-01 09:43:04.322	2026-06-01 12:00:48.744	1
8	14	Edit	edit	2026-06-01 09:43:04.324	2026-06-01 12:00:48.746	1
9	14	Delete	delete	2026-06-01 09:43:04.327	2026-06-01 12:00:48.749	1
10	15	Add	add	2026-06-01 09:43:04.33	2026-06-01 12:00:48.751	1
11	15	Edit	edit	2026-06-01 09:43:04.333	2026-06-01 12:00:48.754	1
20	18	Edit	edit	2026-06-01 09:43:04.358	2026-06-01 12:00:48.78	1
267	132	Delete	delete	2026-06-02 13:34:12.196	2026-06-02 13:34:12.196	1
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."Product" (id, "orgId", name, "productType", "minRate", "maxRate", "minAmount", "maxAmount", "minTerm", "maxTerm", "repaymentMethod", "minAge", "maxAge", "maxCarAge", "maxMileage", "ltvLimit", "minDownPayment", regions, status, "fileChecklist", "createdAt", "updatedAt", "tenantId", "applicableFunders", "accessConditions", "valuationDiscountRate") FROM stdin;
1	1	车抵贷	抵押贷	0.0360	0.1200	10000.00	500000.00	6	36	等额本息	\N	\N	\N	\N	\N	\N	\N	ACTIVE	\N	2026-06-13 17:35:29.044	2026-06-13 17:35:29.044	1	\N	\N	\N
\.


--
-- Data for Name: RepaymentPlan; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."RepaymentPlan" (id, "applicationId", period, "dueDate", principal, interest, "totalAmount", "paidPrincipal", "paidInterest", "paidTotal", status, "overdueDays", "penaltyAmount", "paidAt", "createdAt", "updatedAt", "tenantId") FROM stdin;
\.


--
-- Data for Name: RepaymentRecord; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."RepaymentRecord" (id, "planId", amount, principal, interest, penalty, "paymentMethod", "transactionNo", "voucherUrl", remark, "createdBy", "createdAt", "tenantId") FROM stdin;
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."Role" (id, name, code, description, enabled, "createdAt", "updatedAt", "tenantId", "dataScope") FROM stdin;
1	Super Admin	R_SUPER	平台超级管理员，全平台管理	t	2026-05-27 01:11:44.448	2026-06-01 12:00:48.482	1	ALL
5	Platform Operator	R_OPERATION	平台运营	t	2026-06-01 09:43:04.043	2026-06-01 12:00:48.493	1	ALL
3	Admin	R_ADMIN	机构管理员	t	2026-05-27 01:11:44.448	2026-06-01 12:00:48.496	1	ALL
7	Sales Manager	R_SALES_MANAGER	部门经理/团队负责人	t	2026-06-01 09:43:04.052	2026-06-01 12:00:48.5	1	DEPT
8	Sales	R_SALES	业务员/客户经理	t	2026-06-01 09:43:04.056	2026-06-01 12:00:48.503	1	SELF
9	Approver	R_APPROVER	风控审批员	t	2026-06-01 09:43:04.061	2026-06-01 12:00:48.507	1	ALL
10	Finance	R_FINANCE	财务人员	t	2026-06-01 09:43:04.065	2026-06-01 12:00:48.511	1	ALL
11	CS & Collection	R_CS_COLLECTION	客服/催收	t	2026-06-01 09:43:04.069	2026-06-01 12:00:48.515	1	ALL
2	User	R_USER	普通用户，仅移动端操作权限	t	2026-05-27 01:11:44.448	2026-06-01 12:00:48.519	1	SELF
\.


--
-- Data for Name: RoleMenu; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."RoleMenu" ("roleId", "menuId") FROM stdin;
1	1
1	2
1	3
1	12
1	13
1	14
1	15
1	16
1	17
1	18
1	19
1	20
1	21
1	4
1	5
1	6
1	7
1	26
1	27
1	28
1	29
1	30
1	31
1	8
1	33
1	34
1	35
1	36
1	37
1	38
1	39
1	40
1	41
1	42
1	43
1	44
1	45
1	46
1	47
1	48
1	49
5	1
5	2
5	3
5	12
5	13
5	14
5	15
5	16
5	17
5	18
5	19
5	20
5	21
5	31
5	33
5	39
5	40
5	41
5	42
5	44
5	46
3	1
3	2
3	3
3	4
3	5
3	6
3	7
3	8
3	33
3	34
3	35
3	36
3	37
3	38
3	39
3	40
3	41
3	42
3	43
3	44
3	45
3	46
3	47
3	48
3	49
7	1
7	2
7	3
7	33
7	34
7	35
7	38
7	39
7	40
7	41
7	42
7	43
7	44
7	45
7	46
7	48
8	1
8	2
8	3
8	33
8	39
8	40
8	41
8	43
9	1
9	2
9	3
9	33
9	41
9	42
10	1
10	2
10	3
10	33
10	44
10	45
10	46
10	48
11	1
11	2
11	3
11	33
11	40
11	46
11	48
2	1
2	2
2	3
1	132
3	132
3	12
7	12
\.


--
-- Data for Name: RolePermission; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."RolePermission" ("roleId", "permissionId") FROM stdin;
1	2
\.


--
-- Data for Name: SignRecord; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."SignRecord" (id, "applicationId", status, "contractUrl", "signedAt", "videoUrl", "expiredAt", "cancelledReason", "createdAt", "updatedAt", "tenantId") FROM stdin;
\.


--
-- Data for Name: Tenant; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."Tenant" (id, name, code, status, "createdAt", "updatedAt") FROM stdin;
1	Default Tenant	default	active	2026-05-29 01:50:23.989	2026-05-29 01:50:23.989
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."User" (id, "userName", "passwordHash", "nickName", gender, phone, email, avatar, status, "createdBy", "updatedBy", "createdAt", "updatedAt", "tenantId", "deptId") FROM stdin;
1	User	$2a$10$ahKhxl1We2EBTgh/l0jWauwl4Ss8urN6pra//JbChJinrB9lXr9wu	User	Unknown	13800000003	user@example.com	\N	OFFLINE	system	system	2026-05-27 01:11:44.492	2026-05-27 01:11:44.492	1	\N
2	Admin	$2a$10$ahKhxl1We2EBTgh/l0jWauwl4Ss8urN6pra//JbChJinrB9lXr9wu	Admin	Female	13800000002	admin@example.com	\N	ONLINE	system	system	2026-05-27 01:11:44.491	2026-05-27 01:11:44.491	1	\N
3	Super	$2a$10$ahKhxl1We2EBTgh/l0jWauwl4Ss8urN6pra//JbChJinrB9lXr9wu	Super Admin	未知	13800000001	super@example.com	\N	ONLINE	system	Super	2026-05-27 01:11:44.489	2026-06-03 11:38:50.509	1	\N
\.


--
-- Data for Name: UserRole; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."UserRole" ("userId", "roleId") FROM stdin;
1	2
2	3
3	1
\.


--
-- Data for Name: Vehicle; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public."Vehicle" (id, "customerId", vin, "plateNumber", brand, model, color, year, mileage, "purchasePrice", "estimateValue", "isMortgaged", "mortgageInfo", "createdAt", "updatedAt", "ownerName", address, "usageNature", "sealInfo", "engineNumber", "registerDate", "vehicleImgUrl") FROM stdin;
1	1	WBAPA21070AL12345	京A12345	宝马	3系	白色	2022	50000	350000.00	250000.00	f	\N	2026-06-13 17:36:25.799	2026-06-13 17:36:25.799	\N	\N	\N	\N	B48B20A	\N	\N
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: saas_user
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
1cae223c-4e70-4b7c-a6e2-ab3d15ca7556	be87594a006d815cd3bb9ac16d5c40eebb147940b87cb952224c36910d49711a	2026-05-27 01:11:32.529901+00	20260526072140	\N	\N	2026-05-27 01:11:32.452951+00	1
63027c3d-0413-4a5e-a71b-4bf604a82455	7a033ad06df88e4153c0070c63676cfb681d549b150088644587b4e0b9fce501	2026-06-02 13:34:12.226966+00	20260602171000_fix_flow_config_menu_component	\N	\N	2026-06-02 13:34:12.221086+00	1
7a07209d-be11-4d63-b80d-4c122dd017a7	330b4104cd2d131898b1ab3b234795d07b7cde2494073f179d1053f0341b9c9b	2026-05-29 01:50:24.042234+00	20260527031800_add_multi_tenant	\N	\N	2026-05-29 01:50:23.983752+00	1
30b6ebd9-9ea1-4f93-9235-fdc29097efd1	7cdbd38f12d642a854af6f7b24c5eceba0c5de5e3d72367cfa36648c2da672b4	2026-05-29 02:37:47.644663+00	20260529090000_add_user_center_menu	\N	\N	2026-05-29 02:37:47.630357+00	1
81850d8a-4532-4ca5-8331-d3ccdf18f609	75c4c1e867487624af7677695a7c7357d517aeb1a82a4aa7d5856d2ff1775c3d	2026-06-05 09:33:11.500019+00	20260605183500_configure_data_center_pages	\N	\N	2026-06-05 09:33:11.495484+00	1
3beda924-c68f-4e2b-94e3-9859067581fd	7c3ef517832a8faa9f0678b98dfab32a9cee55609b8b97cd28acc1ce818995a7	2026-05-29 09:29:40.156944+00	20260529031558_init_carloan_business_schema	\N	\N	2026-05-29 09:29:39.884065+00	1
20b08eba-f210-472e-a258-008dd687af4e	3cccae830800260d38d445c1e85360733c6ba30a0c268fd1d97cee5d4416fe2e	2026-06-02 13:34:12.235402+00	20260602172000_seed_default_flow_config	\N	\N	2026-06-02 13:34:12.228426+00	1
7a234882-eb9e-4356-96a6-5d02b2027d24	4bec2c7b94ff106024c52486c51920743567116485db6d74f22abdbab44459f5	2026-05-29 09:29:40.226443+00	20260529113000_add_tenant_to_business_tables	\N	\N	2026-05-29 09:29:40.158273+00	1
a724fa11-a810-469b-bedb-84e60af6805e	445bab495dee00c4d21eb6f6f2e04e3a73d30e13e155ef38f40e45e3e6e14180	2026-06-01 03:43:28.203754+00	20260601093000_enhance_org_product_funder	\N	\N	2026-06-01 03:43:28.19191+00	1
bada3d85-bf2e-48ec-a0fe-81a7f2cf71e8	c84e75fcb28f4f1d7523c13ab2bd178fba6b203c56220bb7a9faf79058f8ace5	2026-06-01 11:56:59.27733+00	20260601172000_add_dict_tables	\N	\N	2026-06-01 11:56:59.232392+00	1
0c4b4782-1776-4b1e-9cab-d8e870d1b124	bb10694ad09421f561ff05aba90994dc9d95ed3fd446f400ce9b3d2108542665	2026-06-02 13:34:12.250577+00	20260602173000_add_application_flow_state	\N	\N	2026-06-02 13:34:12.236657+00	1
01566649-ab70-44ee-987f-cb6cff7491c9	f1eb3996265c453dee1039b1302581dc9203c01e539d147286f29d301c81e67d	2026-06-02 13:34:12.158105+00	20260602093000_add_flow_config	\N	\N	2026-06-02 13:34:12.121813+00	1
ca7c73b7-73b6-4eba-994c-ec392afe5aca	f2bed3ca6db467f9dac72302cc3065d9a7f6bdb9757f7e604ed5dbdbbebce1cc	2026-06-02 13:34:12.183492+00	20260602094500_add_file_assets	\N	\N	2026-06-02 13:34:12.159386+00	1
f1b01b10-9738-4d49-98e6-0838e76e1b91	81735c5416fa8b65522a41fd52f7ac409332b74032174801b8c0a11812545067	2026-06-02 13:34:12.190921+00	20260602143000_fix_file_config_menu_component	\N	\N	2026-06-02 13:34:12.184876+00	1
643427d4-fa99-4bfa-9bb0-ca68ef066a9e	2a7948d94167146b822009209108f3a4937672518bea89b63079c60b88ec3883	2026-06-03 10:56:14.944026+00	20260603183000_extend_application_status_flow	\N	\N	2026-06-03 10:56:14.933876+00	1
0b8df424-716a-4719-a14e-be3313f8f213	4a406b5c37ab435245c34a4d9db2aeae1e2affde3c5ae020666d77219f26c751	2026-06-02 13:34:12.20404+00	20260602144500_add_file_manage_menu	\N	\N	2026-06-02 13:34:12.192383+00	1
5d8bf339-5239-4586-899c-6cb20df5c045	eeb3563291f615bddf7c5a6c90d08aa1d200ddf3fce9b36fdef88306b3e9d552	2026-06-02 13:34:12.211208+00	20260602155500_fix_core_system_menu_components	\N	\N	2026-06-02 13:34:12.20556+00	1
587c131f-9438-4ec4-879f-a9dc5732aa9e	b9af44eb40373cb8ec076501bed1032c0ba5da1540f1bd8cb7c20e2eb9a0c7d9	2026-06-02 13:34:12.219501+00	20260602162000_add_mobile_entry_fields	\N	\N	2026-06-02 13:34:12.212548+00	1
7389e6ce-72cc-45ef-abb1-dc25622c0f8d	ab5a08d8d9abce7f30295b88db869fdf709a80504a2dcf48fa179f6a6e06ac42	2026-06-05 09:33:11.465763+00	20260605172000_simplify_business_phase_menus	\N	\N	2026-06-05 09:33:11.44961+00	1
89ba92f1-8b17-47f9-89bc-870de9a82ed7	9df8db0b3e0aa3d7bed148385451b834e7570e8a0127714297739140a7bd2526	2026-06-05 09:33:11.476866+00	20260605174500_move_business_config_menus_to_platform	\N	\N	2026-06-05 09:33:11.46704+00	1
741c72a6-c2e9-4d4f-be7f-d96aae12ba63	2c001cec06a8716b40fd834a892f906f50af565575e79092c4a69f400dfc0018	2026-06-05 09:33:11.482888+00	20260605180500_hide_duplicate_org_config_menu	\N	\N	2026-06-05 09:33:11.478205+00	1
b4647a8f-e536-422e-b894-2808325fad75	555d6d82f0b221452feb46655615fa0270e8dc14bcd35cdb02a7c35f1632cb45	2026-06-05 09:33:11.494117+00	20260605182500_add_operation_log_tenant_id	\N	\N	2026-06-05 09:33:11.484047+00	1
\.


--
-- Name: ApplicationFile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."ApplicationFile_id_seq"', 1, false);


--
-- Name: Application_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."Application_id_seq"', 2, true);


--
-- Name: ApprovalRecord_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."ApprovalRecord_id_seq"', 1, false);


--
-- Name: BankCard_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."BankCard_id_seq"', 1, false);


--
-- Name: CustomerContact_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."CustomerContact_id_seq"', 1, false);


--
-- Name: Customer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."Customer_id_seq"', 1, true);


--
-- Name: Department_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."Department_id_seq"', 1, false);


--
-- Name: DictData_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."DictData_id_seq"', 1, false);


--
-- Name: DictType_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."DictType_id_seq"', 1, false);


--
-- Name: Disbursement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."Disbursement_id_seq"', 1, false);


--
-- Name: FileAsset_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."FileAsset_id_seq"', 19, true);


--
-- Name: FlowConfig_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."FlowConfig_id_seq"', 34, true);


--
-- Name: Funder_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."Funder_id_seq"', 1, true);


--
-- Name: LeadFollowUp_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."LeadFollowUp_id_seq"', 1, false);


--
-- Name: Lead_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."Lead_id_seq"', 1, true);


--
-- Name: Menu_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."Menu_id_seq"', 138, true);


--
-- Name: OperationLog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."OperationLog_id_seq"', 125, true);


--
-- Name: Organization_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."Organization_id_seq"', 1, true);


--
-- Name: Permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."Permission_id_seq"', 267, true);


--
-- Name: Product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."Product_id_seq"', 1, true);


--
-- Name: RepaymentPlan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."RepaymentPlan_id_seq"', 1, false);


--
-- Name: RepaymentRecord_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."RepaymentRecord_id_seq"', 1, false);


--
-- Name: Role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."Role_id_seq"', 30, true);


--
-- Name: SignRecord_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."SignRecord_id_seq"', 1, false);


--
-- Name: Tenant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."Tenant_id_seq"', 1, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."User_id_seq"', 3, true);


--
-- Name: Vehicle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: saas_user
--

SELECT pg_catalog.setval('public."Vehicle_id_seq"', 1, true);


--
-- Name: ApplicationFile ApplicationFile_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."ApplicationFile"
    ADD CONSTRAINT "ApplicationFile_pkey" PRIMARY KEY (id);


--
-- Name: Application Application_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_pkey" PRIMARY KEY (id);


--
-- Name: ApprovalRecord ApprovalRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."ApprovalRecord"
    ADD CONSTRAINT "ApprovalRecord_pkey" PRIMARY KEY (id);


--
-- Name: BankCard BankCard_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."BankCard"
    ADD CONSTRAINT "BankCard_pkey" PRIMARY KEY (id);


--
-- Name: CustomerContact CustomerContact_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."CustomerContact"
    ADD CONSTRAINT "CustomerContact_pkey" PRIMARY KEY (id);


--
-- Name: Customer Customer_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_pkey" PRIMARY KEY (id);


--
-- Name: Department Department_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_pkey" PRIMARY KEY (id);


--
-- Name: DictData DictData_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."DictData"
    ADD CONSTRAINT "DictData_pkey" PRIMARY KEY (id);


--
-- Name: DictType DictType_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."DictType"
    ADD CONSTRAINT "DictType_pkey" PRIMARY KEY (id);


--
-- Name: Disbursement Disbursement_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Disbursement"
    ADD CONSTRAINT "Disbursement_pkey" PRIMARY KEY (id);


--
-- Name: FileAsset FileAsset_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."FileAsset"
    ADD CONSTRAINT "FileAsset_pkey" PRIMARY KEY (id);


--
-- Name: FlowConfig FlowConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."FlowConfig"
    ADD CONSTRAINT "FlowConfig_pkey" PRIMARY KEY (id);


--
-- Name: Funder Funder_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Funder"
    ADD CONSTRAINT "Funder_pkey" PRIMARY KEY (id);


--
-- Name: LeadFollowUp LeadFollowUp_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."LeadFollowUp"
    ADD CONSTRAINT "LeadFollowUp_pkey" PRIMARY KEY (id);


--
-- Name: Lead Lead_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_pkey" PRIMARY KEY (id);


--
-- Name: Menu Menu_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Menu"
    ADD CONSTRAINT "Menu_pkey" PRIMARY KEY (id);


--
-- Name: OperationLog OperationLog_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."OperationLog"
    ADD CONSTRAINT "OperationLog_pkey" PRIMARY KEY (id);


--
-- Name: Organization Organization_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Organization"
    ADD CONSTRAINT "Organization_pkey" PRIMARY KEY (id);


--
-- Name: Permission Permission_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: RepaymentPlan RepaymentPlan_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."RepaymentPlan"
    ADD CONSTRAINT "RepaymentPlan_pkey" PRIMARY KEY (id);


--
-- Name: RepaymentRecord RepaymentRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."RepaymentRecord"
    ADD CONSTRAINT "RepaymentRecord_pkey" PRIMARY KEY (id);


--
-- Name: RoleMenu RoleMenu_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."RoleMenu"
    ADD CONSTRAINT "RoleMenu_pkey" PRIMARY KEY ("roleId", "menuId");


--
-- Name: RolePermission RolePermission_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionId");


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: SignRecord SignRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."SignRecord"
    ADD CONSTRAINT "SignRecord_pkey" PRIMARY KEY (id);


--
-- Name: Tenant Tenant_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Tenant"
    ADD CONSTRAINT "Tenant_pkey" PRIMARY KEY (id);


--
-- Name: UserRole UserRole_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId", "roleId");


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Vehicle Vehicle_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Vehicle"
    ADD CONSTRAINT "Vehicle_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: ApplicationFile_applicationId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "ApplicationFile_applicationId_idx" ON public."ApplicationFile" USING btree ("applicationId");


--
-- Name: ApplicationFile_fileType_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "ApplicationFile_fileType_idx" ON public."ApplicationFile" USING btree ("fileType");


--
-- Name: Application_applicationNo_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Application_applicationNo_idx" ON public."Application" USING btree ("applicationNo");


--
-- Name: Application_applicationNo_key; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE UNIQUE INDEX "Application_applicationNo_key" ON public."Application" USING btree ("applicationNo");


--
-- Name: Application_businessType_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Application_businessType_idx" ON public."Application" USING btree ("businessType");


--
-- Name: Application_creatorId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Application_creatorId_idx" ON public."Application" USING btree ("creatorId");


--
-- Name: Application_currentNode_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Application_currentNode_idx" ON public."Application" USING btree ("currentNode");


--
-- Name: Application_currentStatus_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Application_currentStatus_idx" ON public."Application" USING btree ("currentStatus");


--
-- Name: Application_customerId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Application_customerId_idx" ON public."Application" USING btree ("customerId");


--
-- Name: Application_orgId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Application_orgId_idx" ON public."Application" USING btree ("orgId");


--
-- Name: Application_status_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Application_status_idx" ON public."Application" USING btree (status);


--
-- Name: Application_tenantId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Application_tenantId_idx" ON public."Application" USING btree ("tenantId");


--
-- Name: ApprovalRecord_applicationId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "ApprovalRecord_applicationId_idx" ON public."ApprovalRecord" USING btree ("applicationId");


--
-- Name: ApprovalRecord_approverId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "ApprovalRecord_approverId_idx" ON public."ApprovalRecord" USING btree ("approverId");


--
-- Name: ApprovalRecord_stage_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "ApprovalRecord_stage_idx" ON public."ApprovalRecord" USING btree (stage);


--
-- Name: ApprovalRecord_tenantId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "ApprovalRecord_tenantId_idx" ON public."ApprovalRecord" USING btree ("tenantId");


--
-- Name: BankCard_customerId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "BankCard_customerId_idx" ON public."BankCard" USING btree ("customerId");


--
-- Name: CustomerContact_customerId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "CustomerContact_customerId_idx" ON public."CustomerContact" USING btree ("customerId");


--
-- Name: Customer_idCard_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Customer_idCard_idx" ON public."Customer" USING btree ("idCard");


--
-- Name: Customer_orgId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Customer_orgId_idx" ON public."Customer" USING btree ("orgId");


--
-- Name: Customer_orgId_phone_key; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE UNIQUE INDEX "Customer_orgId_phone_key" ON public."Customer" USING btree ("orgId", phone);


--
-- Name: Customer_tenantId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Customer_tenantId_idx" ON public."Customer" USING btree ("tenantId");


--
-- Name: Department_orgId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Department_orgId_idx" ON public."Department" USING btree ("orgId");


--
-- Name: Department_orgId_name_key; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE UNIQUE INDEX "Department_orgId_name_key" ON public."Department" USING btree ("orgId", name);


--
-- Name: Department_tenantId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Department_tenantId_idx" ON public."Department" USING btree ("tenantId");


--
-- Name: DictData_status_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "DictData_status_idx" ON public."DictData" USING btree (status);


--
-- Name: DictData_tenantId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "DictData_tenantId_idx" ON public."DictData" USING btree ("tenantId");


--
-- Name: DictData_tenantId_typeId_value_key; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE UNIQUE INDEX "DictData_tenantId_typeId_value_key" ON public."DictData" USING btree ("tenantId", "typeId", value);


--
-- Name: DictData_typeId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "DictData_typeId_idx" ON public."DictData" USING btree ("typeId");


--
-- Name: DictType_status_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "DictType_status_idx" ON public."DictType" USING btree (status);


--
-- Name: DictType_tenantId_code_key; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE UNIQUE INDEX "DictType_tenantId_code_key" ON public."DictType" USING btree ("tenantId", code);


--
-- Name: DictType_tenantId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "DictType_tenantId_idx" ON public."DictType" USING btree ("tenantId");


--
-- Name: Disbursement_applicationId_key; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE UNIQUE INDEX "Disbursement_applicationId_key" ON public."Disbursement" USING btree ("applicationId");


--
-- Name: Disbursement_tenantId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Disbursement_tenantId_idx" ON public."Disbursement" USING btree ("tenantId");


--
-- Name: FileAsset_businessType_businessId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "FileAsset_businessType_businessId_idx" ON public."FileAsset" USING btree ("businessType", "businessId");


--
-- Name: FileAsset_categoryCode_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "FileAsset_categoryCode_idx" ON public."FileAsset" USING btree ("categoryCode");


--
-- Name: FileAsset_orgId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "FileAsset_orgId_idx" ON public."FileAsset" USING btree ("orgId");


--
-- Name: FileAsset_status_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "FileAsset_status_idx" ON public."FileAsset" USING btree (status);


--
-- Name: FileAsset_tenantId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "FileAsset_tenantId_idx" ON public."FileAsset" USING btree ("tenantId");


--
-- Name: FileAsset_uploadedBy_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "FileAsset_uploadedBy_idx" ON public."FileAsset" USING btree ("uploadedBy");


--
-- Name: FlowConfig_businessType_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "FlowConfig_businessType_idx" ON public."FlowConfig" USING btree ("businessType");


--
-- Name: FlowConfig_nodeCode_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "FlowConfig_nodeCode_idx" ON public."FlowConfig" USING btree ("nodeCode");


--
-- Name: FlowConfig_orgId_businessType_nodeCode_key; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE UNIQUE INDEX "FlowConfig_orgId_businessType_nodeCode_key" ON public."FlowConfig" USING btree ("orgId", "businessType", "nodeCode");


--
-- Name: FlowConfig_orgId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "FlowConfig_orgId_idx" ON public."FlowConfig" USING btree ("orgId");


--
-- Name: FlowConfig_status_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "FlowConfig_status_idx" ON public."FlowConfig" USING btree (status);


--
-- Name: FlowConfig_tenantId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "FlowConfig_tenantId_idx" ON public."FlowConfig" USING btree ("tenantId");


--
-- Name: Funder_orgId_code_key; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE UNIQUE INDEX "Funder_orgId_code_key" ON public."Funder" USING btree ("orgId", code);


--
-- Name: Funder_orgId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Funder_orgId_idx" ON public."Funder" USING btree ("orgId");


--
-- Name: Funder_tenantId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Funder_tenantId_idx" ON public."Funder" USING btree ("tenantId");


--
-- Name: LeadFollowUp_leadId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "LeadFollowUp_leadId_idx" ON public."LeadFollowUp" USING btree ("leadId");


--
-- Name: Lead_assigneeId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Lead_assigneeId_idx" ON public."Lead" USING btree ("assigneeId");


--
-- Name: Lead_orgId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Lead_orgId_idx" ON public."Lead" USING btree ("orgId");


--
-- Name: Lead_phone_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Lead_phone_idx" ON public."Lead" USING btree (phone);


--
-- Name: Lead_status_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Lead_status_idx" ON public."Lead" USING btree (status);


--
-- Name: Lead_tenantId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Lead_tenantId_idx" ON public."Lead" USING btree ("tenantId");


--
-- Name: Menu_tenantId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Menu_tenantId_idx" ON public."Menu" USING btree ("tenantId");


--
-- Name: Menu_tenantId_name_key; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE UNIQUE INDEX "Menu_tenantId_name_key" ON public."Menu" USING btree ("tenantId", name);


--
-- Name: OperationLog_createdAt_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "OperationLog_createdAt_idx" ON public."OperationLog" USING btree ("createdAt");


--
-- Name: OperationLog_module_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "OperationLog_module_idx" ON public."OperationLog" USING btree (module);


--
-- Name: OperationLog_orgId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "OperationLog_orgId_idx" ON public."OperationLog" USING btree ("orgId");


--
-- Name: OperationLog_tenantId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "OperationLog_tenantId_idx" ON public."OperationLog" USING btree ("tenantId");


--
-- Name: OperationLog_userId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "OperationLog_userId_idx" ON public."OperationLog" USING btree ("userId");


--
-- Name: Organization_code_key; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE UNIQUE INDEX "Organization_code_key" ON public."Organization" USING btree (code);


--
-- Name: Organization_creditCode_key; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE UNIQUE INDEX "Organization_creditCode_key" ON public."Organization" USING btree ("creditCode");


--
-- Name: Organization_status_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Organization_status_idx" ON public."Organization" USING btree (status);


--
-- Name: Organization_tenantId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Organization_tenantId_idx" ON public."Organization" USING btree ("tenantId");


--
-- Name: Permission_tenantId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Permission_tenantId_idx" ON public."Permission" USING btree ("tenantId");


--
-- Name: Permission_tenantId_menuId_authMark_key; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE UNIQUE INDEX "Permission_tenantId_menuId_authMark_key" ON public."Permission" USING btree ("tenantId", "menuId", "authMark");


--
-- Name: Product_orgId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Product_orgId_idx" ON public."Product" USING btree ("orgId");


--
-- Name: Product_status_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Product_status_idx" ON public."Product" USING btree (status);


--
-- Name: Product_tenantId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Product_tenantId_idx" ON public."Product" USING btree ("tenantId");


--
-- Name: RepaymentPlan_applicationId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "RepaymentPlan_applicationId_idx" ON public."RepaymentPlan" USING btree ("applicationId");


--
-- Name: RepaymentPlan_applicationId_period_key; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE UNIQUE INDEX "RepaymentPlan_applicationId_period_key" ON public."RepaymentPlan" USING btree ("applicationId", period);


--
-- Name: RepaymentPlan_dueDate_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "RepaymentPlan_dueDate_idx" ON public."RepaymentPlan" USING btree ("dueDate");


--
-- Name: RepaymentPlan_status_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "RepaymentPlan_status_idx" ON public."RepaymentPlan" USING btree (status);


--
-- Name: RepaymentPlan_tenantId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "RepaymentPlan_tenantId_idx" ON public."RepaymentPlan" USING btree ("tenantId");


--
-- Name: RepaymentRecord_planId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "RepaymentRecord_planId_idx" ON public."RepaymentRecord" USING btree ("planId");


--
-- Name: RepaymentRecord_tenantId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "RepaymentRecord_tenantId_idx" ON public."RepaymentRecord" USING btree ("tenantId");


--
-- Name: Role_tenantId_code_key; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE UNIQUE INDEX "Role_tenantId_code_key" ON public."Role" USING btree ("tenantId", code);


--
-- Name: Role_tenantId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Role_tenantId_idx" ON public."Role" USING btree ("tenantId");


--
-- Name: SignRecord_applicationId_key; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE UNIQUE INDEX "SignRecord_applicationId_key" ON public."SignRecord" USING btree ("applicationId");


--
-- Name: SignRecord_tenantId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "SignRecord_tenantId_idx" ON public."SignRecord" USING btree ("tenantId");


--
-- Name: Tenant_code_key; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE UNIQUE INDEX "Tenant_code_key" ON public."Tenant" USING btree (code);


--
-- Name: User_deptId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "User_deptId_idx" ON public."User" USING btree ("deptId");


--
-- Name: User_tenantId_email_key; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE UNIQUE INDEX "User_tenantId_email_key" ON public."User" USING btree ("tenantId", email);


--
-- Name: User_tenantId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "User_tenantId_idx" ON public."User" USING btree ("tenantId");


--
-- Name: User_tenantId_userName_key; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE UNIQUE INDEX "User_tenantId_userName_key" ON public."User" USING btree ("tenantId", "userName");


--
-- Name: Vehicle_customerId_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Vehicle_customerId_idx" ON public."Vehicle" USING btree ("customerId");


--
-- Name: Vehicle_vin_idx; Type: INDEX; Schema: public; Owner: saas_user
--

CREATE INDEX "Vehicle_vin_idx" ON public."Vehicle" USING btree (vin);


--
-- Name: ApplicationFile ApplicationFile_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."ApplicationFile"
    ADD CONSTRAINT "ApplicationFile_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."Application"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Application Application_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Application Application_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Application Application_funderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_funderId_fkey" FOREIGN KEY ("funderId") REFERENCES public."Funder"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Application Application_orgId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Application Application_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Application Application_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ApprovalRecord ApprovalRecord_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."ApprovalRecord"
    ADD CONSTRAINT "ApprovalRecord_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."Application"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ApprovalRecord ApprovalRecord_approverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."ApprovalRecord"
    ADD CONSTRAINT "ApprovalRecord_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ApprovalRecord ApprovalRecord_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."ApprovalRecord"
    ADD CONSTRAINT "ApprovalRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BankCard BankCard_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."BankCard"
    ADD CONSTRAINT "BankCard_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CustomerContact CustomerContact_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."CustomerContact"
    ADD CONSTRAINT "CustomerContact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Customer Customer_orgId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Customer Customer_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Department Department_orgId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Department Department_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Department Department_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DictData DictData_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."DictData"
    ADD CONSTRAINT "DictData_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DictData DictData_typeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."DictData"
    ADD CONSTRAINT "DictData_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES public."DictType"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DictType DictType_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."DictType"
    ADD CONSTRAINT "DictType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Disbursement Disbursement_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Disbursement"
    ADD CONSTRAINT "Disbursement_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."Application"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Disbursement Disbursement_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Disbursement"
    ADD CONSTRAINT "Disbursement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FileAsset FileAsset_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."FileAsset"
    ADD CONSTRAINT "FileAsset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FlowConfig FlowConfig_orgId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."FlowConfig"
    ADD CONSTRAINT "FlowConfig_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FlowConfig FlowConfig_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."FlowConfig"
    ADD CONSTRAINT "FlowConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Funder Funder_orgId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Funder"
    ADD CONSTRAINT "Funder_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Funder Funder_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Funder"
    ADD CONSTRAINT "Funder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LeadFollowUp LeadFollowUp_leadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."LeadFollowUp"
    ADD CONSTRAINT "LeadFollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES public."Lead"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Lead Lead_assigneeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Lead Lead_orgId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Lead Lead_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Menu Menu_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Menu"
    ADD CONSTRAINT "Menu_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Menu"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Menu Menu_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Menu"
    ADD CONSTRAINT "Menu_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Organization Organization_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Organization"
    ADD CONSTRAINT "Organization_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Permission Permission_menuId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES public."Menu"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Permission Permission_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Product Product_orgId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Product Product_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RepaymentPlan RepaymentPlan_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."RepaymentPlan"
    ADD CONSTRAINT "RepaymentPlan_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."Application"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RepaymentPlan RepaymentPlan_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."RepaymentPlan"
    ADD CONSTRAINT "RepaymentPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RepaymentRecord RepaymentRecord_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."RepaymentRecord"
    ADD CONSTRAINT "RepaymentRecord_planId_fkey" FOREIGN KEY ("planId") REFERENCES public."RepaymentPlan"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RepaymentRecord RepaymentRecord_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."RepaymentRecord"
    ADD CONSTRAINT "RepaymentRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RoleMenu RoleMenu_menuId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."RoleMenu"
    ADD CONSTRAINT "RoleMenu_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES public."Menu"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RoleMenu RoleMenu_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."RoleMenu"
    ADD CONSTRAINT "RoleMenu_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RolePermission RolePermission_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public."Permission"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RolePermission RolePermission_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Role Role_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SignRecord SignRecord_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."SignRecord"
    ADD CONSTRAINT "SignRecord_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."Application"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SignRecord SignRecord_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."SignRecord"
    ADD CONSTRAINT "SignRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserRole UserRole_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserRole UserRole_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_deptId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_deptId_fkey" FOREIGN KEY ("deptId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Vehicle Vehicle_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: saas_user
--

ALTER TABLE ONLY public."Vehicle"
    ADD CONSTRAINT "Vehicle_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict MfHliJYCWRij532YfsgmuuxVORu8oY9hjC6jF2RUe7DPQHIpVdKYvVieoSo2Mcq


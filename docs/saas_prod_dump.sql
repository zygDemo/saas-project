--
-- PostgreSQL database dump
--

\restrict d5Zb6H30dOAr5frx8O7IHNTLYvbsnOC2yCPC4SSrnyCwIOyKeE2rHEodp5wRqhK

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
-- Name: dblink; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS dblink WITH SCHEMA public;


--
-- Name: EXTENSION dblink; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION dblink IS 'connect to other PostgreSQL databases from within a database';


--
-- Name: ApplicationStatus; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public."ApplicationStatus" OWNER TO postgres;

--
-- Name: ApprovalAction; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ApprovalAction" AS ENUM (
    'PASS',
    'REJECT',
    'SUPPLEMENT',
    'TRANSFER',
    'RETURN',
    'REMARK'
);


ALTER TYPE public."ApprovalAction" OWNER TO postgres;

--
-- Name: DisbursementStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DisbursementStatus" AS ENUM (
    'PENDING_APPLICATION',
    'PENDING_APPROVAL',
    'GPS_INSTALLED',
    'MORTGAGE_DONE',
    'DISBURSED',
    'FAILED'
);


ALTER TYPE public."DisbursementStatus" OWNER TO postgres;

--
-- Name: Gender; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Gender" AS ENUM (
    'MALE',
    'FEMALE',
    'UNKNOWN'
);


ALTER TYPE public."Gender" OWNER TO postgres;

--
-- Name: LeadStatus; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public."LeadStatus" OWNER TO postgres;

--
-- Name: OrgStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrgStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED'
);


ALTER TYPE public."OrgStatus" OWNER TO postgres;

--
-- Name: RepaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RepaymentStatus" AS ENUM (
    'NOT_DUE',
    'PENDING',
    'PARTIAL',
    'PAID',
    'OVERDUE',
    'SETTLED'
);


ALTER TYPE public."RepaymentStatus" OWNER TO postgres;

--
-- Name: SignStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SignStatus" AS ENUM (
    'PENDING',
    'SENT',
    'SIGNED',
    'VIDEO_INTERVIEW_DONE',
    'EXPIRED',
    'CANCELLED'
);


ALTER TYPE public."SignStatus" OWNER TO postgres;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserStatus" AS ENUM (
    'ONLINE',
    'OFFLINE',
    'ABNORMAL',
    'DISABLED'
);


ALTER TYPE public."UserStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Application; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."Application" OWNER TO postgres;

--
-- Name: ApplicationFile; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."ApplicationFile" OWNER TO postgres;

--
-- Name: ApplicationFile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ApplicationFile_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ApplicationFile_id_seq" OWNER TO postgres;

--
-- Name: ApplicationFile_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ApplicationFile_id_seq" OWNED BY public."ApplicationFile".id;


--
-- Name: Application_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Application_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Application_id_seq" OWNER TO postgres;

--
-- Name: Application_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Application_id_seq" OWNED BY public."Application".id;


--
-- Name: ApprovalRecord; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."ApprovalRecord" OWNER TO postgres;

--
-- Name: ApprovalRecord_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ApprovalRecord_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ApprovalRecord_id_seq" OWNER TO postgres;

--
-- Name: ApprovalRecord_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ApprovalRecord_id_seq" OWNED BY public."ApprovalRecord".id;


--
-- Name: BankCard; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."BankCard" OWNER TO postgres;

--
-- Name: BankCard_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."BankCard_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."BankCard_id_seq" OWNER TO postgres;

--
-- Name: BankCard_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."BankCard_id_seq" OWNED BY public."BankCard".id;


--
-- Name: Customer; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."Customer" OWNER TO postgres;

--
-- Name: CustomerContact; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."CustomerContact" OWNER TO postgres;

--
-- Name: CustomerContact_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."CustomerContact_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."CustomerContact_id_seq" OWNER TO postgres;

--
-- Name: CustomerContact_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."CustomerContact_id_seq" OWNED BY public."CustomerContact".id;


--
-- Name: Customer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Customer_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Customer_id_seq" OWNER TO postgres;

--
-- Name: Customer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Customer_id_seq" OWNED BY public."Customer".id;


--
-- Name: Department; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."Department" OWNER TO postgres;

--
-- Name: Department_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Department_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Department_id_seq" OWNER TO postgres;

--
-- Name: Department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Department_id_seq" OWNED BY public."Department".id;


--
-- Name: DictData; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."DictData" OWNER TO postgres;

--
-- Name: DictData_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."DictData_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."DictData_id_seq" OWNER TO postgres;

--
-- Name: DictData_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."DictData_id_seq" OWNED BY public."DictData".id;


--
-- Name: DictType; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."DictType" OWNER TO postgres;

--
-- Name: DictType_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."DictType_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."DictType_id_seq" OWNER TO postgres;

--
-- Name: DictType_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."DictType_id_seq" OWNED BY public."DictType".id;


--
-- Name: Disbursement; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."Disbursement" OWNER TO postgres;

--
-- Name: Disbursement_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Disbursement_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Disbursement_id_seq" OWNER TO postgres;

--
-- Name: Disbursement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Disbursement_id_seq" OWNED BY public."Disbursement".id;


--
-- Name: FileAsset; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."FileAsset" OWNER TO postgres;

--
-- Name: FileAsset_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."FileAsset_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."FileAsset_id_seq" OWNER TO postgres;

--
-- Name: FileAsset_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."FileAsset_id_seq" OWNED BY public."FileAsset".id;


--
-- Name: FlowConfig; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."FlowConfig" OWNER TO postgres;

--
-- Name: FlowConfig_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."FlowConfig_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."FlowConfig_id_seq" OWNER TO postgres;

--
-- Name: FlowConfig_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."FlowConfig_id_seq" OWNED BY public."FlowConfig".id;


--
-- Name: Funder; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."Funder" OWNER TO postgres;

--
-- Name: Funder_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Funder_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Funder_id_seq" OWNER TO postgres;

--
-- Name: Funder_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Funder_id_seq" OWNED BY public."Funder".id;


--
-- Name: Lead; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."Lead" OWNER TO postgres;

--
-- Name: LeadFollowUp; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."LeadFollowUp" OWNER TO postgres;

--
-- Name: LeadFollowUp_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."LeadFollowUp_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."LeadFollowUp_id_seq" OWNER TO postgres;

--
-- Name: LeadFollowUp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."LeadFollowUp_id_seq" OWNED BY public."LeadFollowUp".id;


--
-- Name: Lead_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Lead_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Lead_id_seq" OWNER TO postgres;

--
-- Name: Lead_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Lead_id_seq" OWNED BY public."Lead".id;


--
-- Name: Menu; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."Menu" OWNER TO postgres;

--
-- Name: Menu_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Menu_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Menu_id_seq" OWNER TO postgres;

--
-- Name: Menu_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Menu_id_seq" OWNED BY public."Menu".id;


--
-- Name: OperationLog; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."OperationLog" OWNER TO postgres;

--
-- Name: OperationLog_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."OperationLog_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."OperationLog_id_seq" OWNER TO postgres;

--
-- Name: OperationLog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."OperationLog_id_seq" OWNED BY public."OperationLog".id;


--
-- Name: Organization; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."Organization" OWNER TO postgres;

--
-- Name: Organization_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Organization_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Organization_id_seq" OWNER TO postgres;

--
-- Name: Organization_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Organization_id_seq" OWNED BY public."Organization".id;


--
-- Name: Permission; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."Permission" OWNER TO postgres;

--
-- Name: Permission_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Permission_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Permission_id_seq" OWNER TO postgres;

--
-- Name: Permission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Permission_id_seq" OWNED BY public."Permission".id;


--
-- Name: Product; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."Product" OWNER TO postgres;

--
-- Name: Product_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Product_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Product_id_seq" OWNER TO postgres;

--
-- Name: Product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Product_id_seq" OWNED BY public."Product".id;


--
-- Name: RepaymentPlan; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."RepaymentPlan" OWNER TO postgres;

--
-- Name: RepaymentPlan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."RepaymentPlan_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."RepaymentPlan_id_seq" OWNER TO postgres;

--
-- Name: RepaymentPlan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."RepaymentPlan_id_seq" OWNED BY public."RepaymentPlan".id;


--
-- Name: RepaymentRecord; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."RepaymentRecord" OWNER TO postgres;

--
-- Name: RepaymentRecord_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."RepaymentRecord_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."RepaymentRecord_id_seq" OWNER TO postgres;

--
-- Name: RepaymentRecord_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."RepaymentRecord_id_seq" OWNED BY public."RepaymentRecord".id;


--
-- Name: Role; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."Role" OWNER TO postgres;

--
-- Name: RoleMenu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RoleMenu" (
    "roleId" integer NOT NULL,
    "menuId" integer NOT NULL
);


ALTER TABLE public."RoleMenu" OWNER TO postgres;

--
-- Name: RolePermission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RolePermission" (
    "roleId" integer NOT NULL,
    "permissionId" integer NOT NULL
);


ALTER TABLE public."RolePermission" OWNER TO postgres;

--
-- Name: Role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Role_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Role_id_seq" OWNER TO postgres;

--
-- Name: Role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Role_id_seq" OWNED BY public."Role".id;


--
-- Name: SignRecord; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."SignRecord" OWNER TO postgres;

--
-- Name: SignRecord_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SignRecord_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SignRecord_id_seq" OWNER TO postgres;

--
-- Name: SignRecord_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SignRecord_id_seq" OWNED BY public."SignRecord".id;


--
-- Name: Tenant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Tenant" (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Tenant" OWNER TO postgres;

--
-- Name: Tenant_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Tenant_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Tenant_id_seq" OWNER TO postgres;

--
-- Name: Tenant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Tenant_id_seq" OWNED BY public."Tenant".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: UserRole; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserRole" (
    "userId" integer NOT NULL,
    "roleId" integer NOT NULL
);


ALTER TABLE public."UserRole" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_id_seq" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: Vehicle; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public."Vehicle" OWNER TO postgres;

--
-- Name: Vehicle_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Vehicle_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Vehicle_id_seq" OWNER TO postgres;

--
-- Name: Vehicle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Vehicle_id_seq" OWNED BY public."Vehicle".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: backup_Menu_20260615032504; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."backup_Menu_20260615032504" (
    id integer,
    "parentId" integer,
    path text,
    name text,
    component text,
    title text,
    icon text,
    sort integer,
    "keepAlive" boolean,
    hidden boolean,
    "hiddenTab" boolean,
    link text,
    iframe boolean,
    "createdAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone,
    "tenantId" integer
);


ALTER TABLE public."backup_Menu_20260615032504" OWNER TO postgres;

--
-- Name: backup_Permission_20260615032504; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."backup_Permission_20260615032504" (
    id integer,
    "menuId" integer,
    title text,
    "authMark" text,
    "createdAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone,
    "tenantId" integer
);


ALTER TABLE public."backup_Permission_20260615032504" OWNER TO postgres;

--
-- Name: backup_RoleMenu_20260615032504; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."backup_RoleMenu_20260615032504" (
    "roleId" integer,
    "menuId" integer
);


ALTER TABLE public."backup_RoleMenu_20260615032504" OWNER TO postgres;

--
-- Name: backup_RolePermission_20260615032504; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."backup_RolePermission_20260615032504" (
    "roleId" integer,
    "permissionId" integer
);


ALTER TABLE public."backup_RolePermission_20260615032504" OWNER TO postgres;

--
-- Name: Application id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Application" ALTER COLUMN id SET DEFAULT nextval('public."Application_id_seq"'::regclass);


--
-- Name: ApplicationFile id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ApplicationFile" ALTER COLUMN id SET DEFAULT nextval('public."ApplicationFile_id_seq"'::regclass);


--
-- Name: ApprovalRecord id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ApprovalRecord" ALTER COLUMN id SET DEFAULT nextval('public."ApprovalRecord_id_seq"'::regclass);


--
-- Name: BankCard id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BankCard" ALTER COLUMN id SET DEFAULT nextval('public."BankCard_id_seq"'::regclass);


--
-- Name: Customer id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customer" ALTER COLUMN id SET DEFAULT nextval('public."Customer_id_seq"'::regclass);


--
-- Name: CustomerContact id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CustomerContact" ALTER COLUMN id SET DEFAULT nextval('public."CustomerContact_id_seq"'::regclass);


--
-- Name: Department id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Department" ALTER COLUMN id SET DEFAULT nextval('public."Department_id_seq"'::regclass);


--
-- Name: DictData id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DictData" ALTER COLUMN id SET DEFAULT nextval('public."DictData_id_seq"'::regclass);


--
-- Name: DictType id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DictType" ALTER COLUMN id SET DEFAULT nextval('public."DictType_id_seq"'::regclass);


--
-- Name: Disbursement id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Disbursement" ALTER COLUMN id SET DEFAULT nextval('public."Disbursement_id_seq"'::regclass);


--
-- Name: FileAsset id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FileAsset" ALTER COLUMN id SET DEFAULT nextval('public."FileAsset_id_seq"'::regclass);


--
-- Name: FlowConfig id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FlowConfig" ALTER COLUMN id SET DEFAULT nextval('public."FlowConfig_id_seq"'::regclass);


--
-- Name: Funder id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Funder" ALTER COLUMN id SET DEFAULT nextval('public."Funder_id_seq"'::regclass);


--
-- Name: Lead id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Lead" ALTER COLUMN id SET DEFAULT nextval('public."Lead_id_seq"'::regclass);


--
-- Name: LeadFollowUp id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LeadFollowUp" ALTER COLUMN id SET DEFAULT nextval('public."LeadFollowUp_id_seq"'::regclass);


--
-- Name: Menu id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Menu" ALTER COLUMN id SET DEFAULT nextval('public."Menu_id_seq"'::regclass);


--
-- Name: OperationLog id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OperationLog" ALTER COLUMN id SET DEFAULT nextval('public."OperationLog_id_seq"'::regclass);


--
-- Name: Organization id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Organization" ALTER COLUMN id SET DEFAULT nextval('public."Organization_id_seq"'::regclass);


--
-- Name: Permission id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permission" ALTER COLUMN id SET DEFAULT nextval('public."Permission_id_seq"'::regclass);


--
-- Name: Product id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product" ALTER COLUMN id SET DEFAULT nextval('public."Product_id_seq"'::regclass);


--
-- Name: RepaymentPlan id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RepaymentPlan" ALTER COLUMN id SET DEFAULT nextval('public."RepaymentPlan_id_seq"'::regclass);


--
-- Name: RepaymentRecord id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RepaymentRecord" ALTER COLUMN id SET DEFAULT nextval('public."RepaymentRecord_id_seq"'::regclass);


--
-- Name: Role id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Role" ALTER COLUMN id SET DEFAULT nextval('public."Role_id_seq"'::regclass);


--
-- Name: SignRecord id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SignRecord" ALTER COLUMN id SET DEFAULT nextval('public."SignRecord_id_seq"'::regclass);


--
-- Name: Tenant id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Tenant" ALTER COLUMN id SET DEFAULT nextval('public."Tenant_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Name: Vehicle id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Vehicle" ALTER COLUMN id SET DEFAULT nextval('public."Vehicle_id_seq"'::regclass);


--
-- Data for Name: Application; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Application" (id, "orgId", "customerId", "productId", "funderId", "applicationNo", amount, term, rate, "repaymentMethod", purpose, status, "creatorId", "sourceLeadId", "supplementReason", "supplementDeadline", "approvedAmount", "approvedTerm", "approvedRate", remark, "createdAt", "updatedAt", "tenantId", "businessType", "currentNode", "currentStatus") FROM stdin;
3	1	2	1	1	APP202606031543330599	300000.00	12	0.0360	等额本息	\N	SUBMITTED	5	\N	\N	\N	\N	\N	\N	移动端身份证信息提交自动创建订单草稿	2026-06-03 07:43:33.412	2026-06-03 09:47:24.007	1	CAR_LOAN	2000	10
1	1	1	1	1	APP-DEMO-0001	120000.00	24	0.0680	等额本息	经营周转	PENDING_DISBURSEMENT	1	1	\N	\N	115000.00	24	0.0660	示例进件数据	2026-06-01 02:04:33.37	2026-06-03 10:50:26.029	1	CAR_LOAN	7000	10
\.


--
-- Data for Name: ApplicationFile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ApplicationFile" (id, "applicationId", "fileType", "fileUrl", "fileName", "ocrResult", "isValid", "createdAt") FROM stdin;
3	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/ab24307b-355b-4624-aea5-4e3215b20d40.jpg	ab24307b-355b-4624-aea5-4e3215b20d40.jpg	\N	t	2026-06-03 07:43:33.438
4	3	ID_CARD_BACK	/saas/api/uploads/images/202606/f9260591-0a47-466f-b19c-8430adb7871c.jpg	f9260591-0a47-466f-b19c-8430adb7871c.jpg	\N	t	2026-06-03 07:43:33.438
5	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/ab24307b-355b-4624-aea5-4e3215b20d40.jpg	ab24307b-355b-4624-aea5-4e3215b20d40.jpg	\N	t	2026-06-03 07:43:33.438
6	3	ID_CARD_BACK	/saas/api/uploads/images/202606/f9260591-0a47-466f-b19c-8430adb7871c.jpg	f9260591-0a47-466f-b19c-8430adb7871c.jpg	\N	t	2026-06-03 07:43:33.438
7	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 07:43:33.438
8	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 07:43:33.438
9	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 07:43:33.438
10	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 07:43:33.438
11	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 07:43:33.438
12	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 07:43:33.438
13	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 07:43:33.438
14	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 07:43:33.438
15	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 07:43:33.438
16	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 07:43:33.438
17	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 07:43:33.438
18	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 07:43:33.438
19	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 07:43:33.438
20	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 07:43:33.438
21	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/ab24307b-355b-4624-aea5-4e3215b20d40.jpg	ab24307b-355b-4624-aea5-4e3215b20d40.jpg	\N	t	2026-06-03 07:56:43.925
22	3	ID_CARD_BACK	/saas/api/uploads/images/202606/f9260591-0a47-466f-b19c-8430adb7871c.jpg	f9260591-0a47-466f-b19c-8430adb7871c.jpg	\N	t	2026-06-03 07:56:43.925
23	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/ab24307b-355b-4624-aea5-4e3215b20d40.jpg	ab24307b-355b-4624-aea5-4e3215b20d40.jpg	\N	t	2026-06-03 07:56:43.925
24	3	ID_CARD_BACK	/saas/api/uploads/images/202606/f9260591-0a47-466f-b19c-8430adb7871c.jpg	f9260591-0a47-466f-b19c-8430adb7871c.jpg	\N	t	2026-06-03 07:56:43.925
25	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 07:56:43.925
26	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 07:56:43.925
27	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 07:56:43.925
28	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 07:56:43.925
29	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 07:56:43.925
30	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 07:56:43.925
31	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 07:56:43.925
32	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 07:56:43.925
33	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 07:56:43.925
34	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 07:56:43.925
35	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 07:56:43.925
36	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 07:56:43.925
37	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 07:56:43.925
38	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 07:56:43.925
39	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 07:56:43.925
40	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 07:56:43.925
41	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/ab24307b-355b-4624-aea5-4e3215b20d40.jpg	ab24307b-355b-4624-aea5-4e3215b20d40.jpg	\N	t	2026-06-03 08:03:11.804
42	3	ID_CARD_BACK	/saas/api/uploads/images/202606/f9260591-0a47-466f-b19c-8430adb7871c.jpg	f9260591-0a47-466f-b19c-8430adb7871c.jpg	\N	t	2026-06-03 08:03:11.804
43	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/ab24307b-355b-4624-aea5-4e3215b20d40.jpg	ab24307b-355b-4624-aea5-4e3215b20d40.jpg	\N	t	2026-06-03 08:03:11.804
44	3	ID_CARD_BACK	/saas/api/uploads/images/202606/f9260591-0a47-466f-b19c-8430adb7871c.jpg	f9260591-0a47-466f-b19c-8430adb7871c.jpg	\N	t	2026-06-03 08:03:11.804
45	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 08:03:11.804
46	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 08:03:11.804
47	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 08:03:11.804
48	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 08:03:11.804
49	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 08:03:11.804
50	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 08:03:11.804
51	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 08:03:11.804
52	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 08:03:11.804
53	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 08:03:11.804
54	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 08:03:11.804
55	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 08:03:11.804
56	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 08:03:11.804
57	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 08:03:11.804
58	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 08:03:11.804
59	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 08:03:11.804
60	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 08:03:11.804
61	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/c8484f9b-f7e4-4754-a5d1-bb69aafd038d.jpg	c8484f9b-f7e4-4754-a5d1-bb69aafd038d.jpg	\N	t	2026-06-03 08:03:11.804
62	3	ID_CARD_BACK	/saas/api/uploads/images/202606/073edb93-a88c-4027-a427-d4f2105c2c11.jpg	073edb93-a88c-4027-a427-d4f2105c2c11.jpg	\N	t	2026-06-03 08:03:11.804
63	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/ab24307b-355b-4624-aea5-4e3215b20d40.jpg	ab24307b-355b-4624-aea5-4e3215b20d40.jpg	\N	t	2026-06-03 09:20:25.281
64	3	ID_CARD_BACK	/saas/api/uploads/images/202606/f9260591-0a47-466f-b19c-8430adb7871c.jpg	f9260591-0a47-466f-b19c-8430adb7871c.jpg	\N	t	2026-06-03 09:20:25.281
65	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/ab24307b-355b-4624-aea5-4e3215b20d40.jpg	ab24307b-355b-4624-aea5-4e3215b20d40.jpg	\N	t	2026-06-03 09:20:25.281
66	3	ID_CARD_BACK	/saas/api/uploads/images/202606/f9260591-0a47-466f-b19c-8430adb7871c.jpg	f9260591-0a47-466f-b19c-8430adb7871c.jpg	\N	t	2026-06-03 09:20:25.281
67	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:20:25.281
68	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:20:25.281
69	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:20:25.281
70	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:20:25.281
71	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:20:25.281
72	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:20:25.281
73	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:20:25.281
74	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:20:25.281
75	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:20:25.281
76	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:20:25.281
77	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:20:25.281
78	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:20:25.281
79	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:20:25.281
80	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:20:25.281
81	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:20:25.281
82	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:20:25.281
83	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/c8484f9b-f7e4-4754-a5d1-bb69aafd038d.jpg	c8484f9b-f7e4-4754-a5d1-bb69aafd038d.jpg	\N	t	2026-06-03 09:20:25.281
84	3	ID_CARD_BACK	/saas/api/uploads/images/202606/073edb93-a88c-4027-a427-d4f2105c2c11.jpg	073edb93-a88c-4027-a427-d4f2105c2c11.jpg	\N	t	2026-06-03 09:20:25.281
85	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/47d8e2df-b8cb-4326-9d21-651a43fcd8b2.jpg	47d8e2df-b8cb-4326-9d21-651a43fcd8b2.jpg	\N	t	2026-06-03 09:20:25.281
86	3	ID_CARD_BACK	/saas/api/uploads/images/202606/785207c7-896a-4a7b-8fc3-604069b80903.jpg	785207c7-896a-4a7b-8fc3-604069b80903.jpg	\N	t	2026-06-03 09:20:25.281
87	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/ab24307b-355b-4624-aea5-4e3215b20d40.jpg	ab24307b-355b-4624-aea5-4e3215b20d40.jpg	\N	t	2026-06-03 09:22:42.95
88	3	ID_CARD_BACK	/saas/api/uploads/images/202606/f9260591-0a47-466f-b19c-8430adb7871c.jpg	f9260591-0a47-466f-b19c-8430adb7871c.jpg	\N	t	2026-06-03 09:22:42.95
89	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/ab24307b-355b-4624-aea5-4e3215b20d40.jpg	ab24307b-355b-4624-aea5-4e3215b20d40.jpg	\N	t	2026-06-03 09:22:42.95
90	3	ID_CARD_BACK	/saas/api/uploads/images/202606/f9260591-0a47-466f-b19c-8430adb7871c.jpg	f9260591-0a47-466f-b19c-8430adb7871c.jpg	\N	t	2026-06-03 09:22:42.95
91	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:22:42.95
92	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:22:42.95
93	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:22:42.95
94	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:22:42.95
95	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:22:42.95
96	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:22:42.95
97	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:22:42.95
98	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:22:42.95
99	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:22:42.95
100	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:22:42.95
101	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:22:42.95
102	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:22:42.95
103	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:22:42.95
104	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:22:42.95
105	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:22:42.95
106	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:22:42.95
107	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/c8484f9b-f7e4-4754-a5d1-bb69aafd038d.jpg	c8484f9b-f7e4-4754-a5d1-bb69aafd038d.jpg	\N	t	2026-06-03 09:22:42.95
108	3	ID_CARD_BACK	/saas/api/uploads/images/202606/073edb93-a88c-4027-a427-d4f2105c2c11.jpg	073edb93-a88c-4027-a427-d4f2105c2c11.jpg	\N	t	2026-06-03 09:22:42.95
109	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/47d8e2df-b8cb-4326-9d21-651a43fcd8b2.jpg	47d8e2df-b8cb-4326-9d21-651a43fcd8b2.jpg	\N	t	2026-06-03 09:22:42.95
110	3	ID_CARD_BACK	/saas/api/uploads/images/202606/785207c7-896a-4a7b-8fc3-604069b80903.jpg	785207c7-896a-4a7b-8fc3-604069b80903.jpg	\N	t	2026-06-03 09:22:42.95
111	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/d292ade3-1678-4fe7-ad9e-fc7e535c2157.jpg	d292ade3-1678-4fe7-ad9e-fc7e535c2157.jpg	\N	t	2026-06-03 09:22:42.95
112	3	ID_CARD_BACK	/saas/api/uploads/images/202606/1c0de194-749f-43d3-9dbe-8cdfbd6971bd.jpg	1c0de194-749f-43d3-9dbe-8cdfbd6971bd.jpg	\N	t	2026-06-03 09:22:42.95
113	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/ab24307b-355b-4624-aea5-4e3215b20d40.jpg	ab24307b-355b-4624-aea5-4e3215b20d40.jpg	\N	t	2026-06-03 09:31:43.905
114	3	ID_CARD_BACK	/saas/api/uploads/images/202606/f9260591-0a47-466f-b19c-8430adb7871c.jpg	f9260591-0a47-466f-b19c-8430adb7871c.jpg	\N	t	2026-06-03 09:31:43.905
115	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/ab24307b-355b-4624-aea5-4e3215b20d40.jpg	ab24307b-355b-4624-aea5-4e3215b20d40.jpg	\N	t	2026-06-03 09:31:43.905
116	3	ID_CARD_BACK	/saas/api/uploads/images/202606/f9260591-0a47-466f-b19c-8430adb7871c.jpg	f9260591-0a47-466f-b19c-8430adb7871c.jpg	\N	t	2026-06-03 09:31:43.905
117	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:31:43.905
118	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:31:43.905
119	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:31:43.905
120	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:31:43.905
121	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:31:43.905
122	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:31:43.905
123	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:31:43.905
124	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:31:43.905
125	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:31:43.905
126	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:31:43.905
127	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:31:43.905
128	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:31:43.905
129	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:31:43.905
130	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:31:43.905
131	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:31:43.905
132	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:31:43.905
133	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/c8484f9b-f7e4-4754-a5d1-bb69aafd038d.jpg	c8484f9b-f7e4-4754-a5d1-bb69aafd038d.jpg	\N	t	2026-06-03 09:31:43.905
134	3	ID_CARD_BACK	/saas/api/uploads/images/202606/073edb93-a88c-4027-a427-d4f2105c2c11.jpg	073edb93-a88c-4027-a427-d4f2105c2c11.jpg	\N	t	2026-06-03 09:31:43.905
135	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/47d8e2df-b8cb-4326-9d21-651a43fcd8b2.jpg	47d8e2df-b8cb-4326-9d21-651a43fcd8b2.jpg	\N	t	2026-06-03 09:31:43.905
136	3	ID_CARD_BACK	/saas/api/uploads/images/202606/785207c7-896a-4a7b-8fc3-604069b80903.jpg	785207c7-896a-4a7b-8fc3-604069b80903.jpg	\N	t	2026-06-03 09:31:43.905
137	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/d292ade3-1678-4fe7-ad9e-fc7e535c2157.jpg	d292ade3-1678-4fe7-ad9e-fc7e535c2157.jpg	\N	t	2026-06-03 09:31:43.905
138	3	ID_CARD_BACK	/saas/api/uploads/images/202606/1c0de194-749f-43d3-9dbe-8cdfbd6971bd.jpg	1c0de194-749f-43d3-9dbe-8cdfbd6971bd.jpg	\N	t	2026-06-03 09:31:43.905
139	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/d292ade3-1678-4fe7-ad9e-fc7e535c2157.jpg	d292ade3-1678-4fe7-ad9e-fc7e535c2157.jpg	\N	t	2026-06-03 09:31:43.905
140	3	ID_CARD_BACK	/saas/api/uploads/images/202606/1c0de194-749f-43d3-9dbe-8cdfbd6971bd.jpg	1c0de194-749f-43d3-9dbe-8cdfbd6971bd.jpg	\N	t	2026-06-03 09:31:43.905
141	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/ab24307b-355b-4624-aea5-4e3215b20d40.jpg	ab24307b-355b-4624-aea5-4e3215b20d40.jpg	\N	t	2026-06-03 09:46:05.164
142	3	ID_CARD_BACK	/saas/api/uploads/images/202606/f9260591-0a47-466f-b19c-8430adb7871c.jpg	f9260591-0a47-466f-b19c-8430adb7871c.jpg	\N	t	2026-06-03 09:46:05.164
143	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/ab24307b-355b-4624-aea5-4e3215b20d40.jpg	ab24307b-355b-4624-aea5-4e3215b20d40.jpg	\N	t	2026-06-03 09:46:05.164
144	3	ID_CARD_BACK	/saas/api/uploads/images/202606/f9260591-0a47-466f-b19c-8430adb7871c.jpg	f9260591-0a47-466f-b19c-8430adb7871c.jpg	\N	t	2026-06-03 09:46:05.164
145	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:46:05.164
146	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:46:05.164
147	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:46:05.164
148	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:46:05.164
149	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:46:05.164
150	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:46:05.164
151	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:46:05.164
152	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:46:05.164
153	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:46:05.164
154	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:46:05.164
155	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:46:05.164
156	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:46:05.164
157	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:46:05.164
158	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:46:05.164
159	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:46:05.164
160	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:46:05.164
161	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/c8484f9b-f7e4-4754-a5d1-bb69aafd038d.jpg	c8484f9b-f7e4-4754-a5d1-bb69aafd038d.jpg	\N	t	2026-06-03 09:46:05.164
162	3	ID_CARD_BACK	/saas/api/uploads/images/202606/073edb93-a88c-4027-a427-d4f2105c2c11.jpg	073edb93-a88c-4027-a427-d4f2105c2c11.jpg	\N	t	2026-06-03 09:46:05.164
163	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/47d8e2df-b8cb-4326-9d21-651a43fcd8b2.jpg	47d8e2df-b8cb-4326-9d21-651a43fcd8b2.jpg	\N	t	2026-06-03 09:46:05.164
164	3	ID_CARD_BACK	/saas/api/uploads/images/202606/785207c7-896a-4a7b-8fc3-604069b80903.jpg	785207c7-896a-4a7b-8fc3-604069b80903.jpg	\N	t	2026-06-03 09:46:05.164
165	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/d292ade3-1678-4fe7-ad9e-fc7e535c2157.jpg	d292ade3-1678-4fe7-ad9e-fc7e535c2157.jpg	\N	t	2026-06-03 09:46:05.164
166	3	ID_CARD_BACK	/saas/api/uploads/images/202606/1c0de194-749f-43d3-9dbe-8cdfbd6971bd.jpg	1c0de194-749f-43d3-9dbe-8cdfbd6971bd.jpg	\N	t	2026-06-03 09:46:05.164
167	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/d292ade3-1678-4fe7-ad9e-fc7e535c2157.jpg	d292ade3-1678-4fe7-ad9e-fc7e535c2157.jpg	\N	t	2026-06-03 09:46:05.164
168	3	ID_CARD_BACK	/saas/api/uploads/images/202606/1c0de194-749f-43d3-9dbe-8cdfbd6971bd.jpg	1c0de194-749f-43d3-9dbe-8cdfbd6971bd.jpg	\N	t	2026-06-03 09:46:05.164
169	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/caf45c5e-3956-4c8e-b609-254d6a3d29ee.jpg	caf45c5e-3956-4c8e-b609-254d6a3d29ee.jpg	\N	t	2026-06-03 09:46:05.164
170	3	ID_CARD_BACK	/saas/api/uploads/images/202606/632ff110-a769-4ba8-aa70-846be2fa6c52.jpg	632ff110-a769-4ba8-aa70-846be2fa6c52.jpg	\N	t	2026-06-03 09:46:05.164
171	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/ab24307b-355b-4624-aea5-4e3215b20d40.jpg	ab24307b-355b-4624-aea5-4e3215b20d40.jpg	\N	t	2026-06-03 09:47:24.03
172	3	ID_CARD_BACK	/saas/api/uploads/images/202606/f9260591-0a47-466f-b19c-8430adb7871c.jpg	f9260591-0a47-466f-b19c-8430adb7871c.jpg	\N	t	2026-06-03 09:47:24.03
173	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/ab24307b-355b-4624-aea5-4e3215b20d40.jpg	ab24307b-355b-4624-aea5-4e3215b20d40.jpg	\N	t	2026-06-03 09:47:24.03
174	3	ID_CARD_BACK	/saas/api/uploads/images/202606/f9260591-0a47-466f-b19c-8430adb7871c.jpg	f9260591-0a47-466f-b19c-8430adb7871c.jpg	\N	t	2026-06-03 09:47:24.03
175	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:47:24.03
176	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:47:24.03
177	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:47:24.03
178	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:47:24.03
179	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:47:24.03
180	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:47:24.03
181	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:47:24.03
182	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:47:24.03
183	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:47:24.03
184	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:47:24.03
185	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:47:24.03
186	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:47:24.03
187	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:47:24.03
188	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:47:24.03
189	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	57a38060-875c-44bc-8ebd-306fa202dfe0.jpg	\N	t	2026-06-03 09:47:24.03
190	3	ID_CARD_BACK	/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg	b7104d18-821c-4660-9730-0d99c7f63168.jpg	\N	t	2026-06-03 09:47:24.03
191	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/c8484f9b-f7e4-4754-a5d1-bb69aafd038d.jpg	c8484f9b-f7e4-4754-a5d1-bb69aafd038d.jpg	\N	t	2026-06-03 09:47:24.03
192	3	ID_CARD_BACK	/saas/api/uploads/images/202606/073edb93-a88c-4027-a427-d4f2105c2c11.jpg	073edb93-a88c-4027-a427-d4f2105c2c11.jpg	\N	t	2026-06-03 09:47:24.03
193	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/47d8e2df-b8cb-4326-9d21-651a43fcd8b2.jpg	47d8e2df-b8cb-4326-9d21-651a43fcd8b2.jpg	\N	t	2026-06-03 09:47:24.03
194	3	ID_CARD_BACK	/saas/api/uploads/images/202606/785207c7-896a-4a7b-8fc3-604069b80903.jpg	785207c7-896a-4a7b-8fc3-604069b80903.jpg	\N	t	2026-06-03 09:47:24.03
195	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/d292ade3-1678-4fe7-ad9e-fc7e535c2157.jpg	d292ade3-1678-4fe7-ad9e-fc7e535c2157.jpg	\N	t	2026-06-03 09:47:24.03
196	3	ID_CARD_BACK	/saas/api/uploads/images/202606/1c0de194-749f-43d3-9dbe-8cdfbd6971bd.jpg	1c0de194-749f-43d3-9dbe-8cdfbd6971bd.jpg	\N	t	2026-06-03 09:47:24.03
197	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/d292ade3-1678-4fe7-ad9e-fc7e535c2157.jpg	d292ade3-1678-4fe7-ad9e-fc7e535c2157.jpg	\N	t	2026-06-03 09:47:24.03
198	3	ID_CARD_BACK	/saas/api/uploads/images/202606/1c0de194-749f-43d3-9dbe-8cdfbd6971bd.jpg	1c0de194-749f-43d3-9dbe-8cdfbd6971bd.jpg	\N	t	2026-06-03 09:47:24.03
199	3	ID_CARD_FRONT	/saas/api/uploads/images/202606/caf45c5e-3956-4c8e-b609-254d6a3d29ee.jpg	caf45c5e-3956-4c8e-b609-254d6a3d29ee.jpg	\N	t	2026-06-03 09:47:24.03
200	3	ID_CARD_BACK	/saas/api/uploads/images/202606/632ff110-a769-4ba8-aa70-846be2fa6c52.jpg	632ff110-a769-4ba8-aa70-846be2fa6c52.jpg	\N	t	2026-06-03 09:47:24.03
201	3	VEHICLE_LICENSE	/saas/api/uploads/images/202606/642c260e-cb5e-48c3-90b1-17511afe86c0.jpg	642c260e-cb5e-48c3-90b1-17511afe86c0.jpg	\N	t	2026-06-03 09:47:24.03
1	1	ID_CARD	https://example.com/files/id-card.jpg	身份证.jpg	\N	t	2026-06-01 02:04:33.383
2	1	VEHICLE_LICENSE	https://example.com/files/vehicle-license.jpg	行驶证.jpg	\N	t	2026-06-01 02:04:33.39
\.


--
-- Data for Name: ApprovalRecord; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ApprovalRecord" (id, "applicationId", "approverId", stage, action, opinion, amount, term, rate, "createdAt", "tenantId") FROM stdin;
1	1	4	FIRST_REVIEW	PASS	资料完整，初审通过	115000.00	24	0.0660	2026-06-01 02:04:33.398	1
2	1	4	FINAL_REVIEW	PASS	终审通过，可进入签约放款	115000.00	24	0.0660	2026-06-01 02:04:33.407	1
\.


--
-- Data for Name: BankCard; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BankCard" (id, "customerId", "bankName", "cardNo", "cardType", "isDefault", "createdAt") FROM stdin;
1	1	示例银行	6222000000000000000	借记卡	t	2026-06-01 02:04:33.35
\.


--
-- Data for Name: Customer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Customer" (id, "orgId", name, phone, "idCard", gender, "birthDate", "maritalStatus", education, occupation, "companyName", "monthlyIncome", address, "emergencyName", "emergencyPhone", status, "createdAt", "updatedAt", "tenantId", nation, "householdAddress", "issuingAuthority", "idCardValidFrom", "idCardValidTo", "idCardFront", "idCardBack") FROM stdin;
2	1	朱雨贵	18538529932	412823199909044812	MALE	1999-09-04 00:00:00	\N	\N	\N	\N	\N	河南省遂平县阳丰乡大石桥村大石桥01-376	\N	\N	ACTIVE	2026-06-03 03:49:08.692	2026-06-03 09:46:05.107	1	1	河南省遂平县阳丰乡大石桥村大石桥01-376	遂平县公安局	2019-05-27	2029-05-27	images/202606/caf45c5e-3956-4c8e-b609-254d6a3d29ee.jpg	images/202606/632ff110-a769-4ba8-aa70-846be2fa6c52.jpg
1	1	王小明	13910000001	110101199001010011	MALE	\N	\N	\N	\N	北京示例商贸有限公司	28000.00	北京市海淀区示例小区 8 号	王女士	13910000002	ACTIVE	2026-06-01 02:04:33.328	2026-06-03 10:50:25.987	1	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: CustomerContact; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CustomerContact" (id, "customerId", name, relation, phone, address, "isEmergency", "createdAt") FROM stdin;
1	1	王女士	配偶	13910000002	北京市海淀区示例小区 8 号	t	2026-06-01 02:04:33.357
\.


--
-- Data for Name: Department; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Department" (id, "orgId", "parentId", name, "managerId", sort, "createdAt", "updatedAt", "tenantId") FROM stdin;
2	4	\N	业务部	\N	0	2026-06-01 06:19:22.34	2026-06-01 06:19:22.34	1
3	1	\N	移动端测试业务部	7	10	2026-06-01 06:19:48.648	2026-06-01 06:19:48.764	1
1	1	\N	车贷业务一部	1	1	2026-06-01 02:04:33.282	2026-06-03 10:50:25.943	1
\.


--
-- Data for Name: DictData; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DictData" (id, "tenantId", "typeId", label, value, sort, status, remark, "createdAt", "updatedAt") FROM stdin;
1	1	4	是	1	0	ACTIVE		2026-06-01 10:45:15.376	2026-06-01 10:45:15.376
2	1	4	否	2	0	ACTIVE		2026-06-01 10:45:25.289	2026-06-01 10:45:25.289
3	1	1	男	1	0	ACTIVE		2026-06-01 10:45:34.457	2026-06-01 10:45:34.457
4	1	1	女	2	0	ACTIVE		2026-06-01 10:45:40.636	2026-06-01 10:45:40.636
\.


--
-- Data for Name: DictType; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DictType" (id, "tenantId", name, code, status, remark, "createdAt", "updatedAt") FROM stdin;
1	1	性别	sex	ACTIVE		2026-06-01 10:41:48.652	2026-06-01 10:41:48.652
4	1	是否	if	ACTIVE		2026-06-01 10:44:57.207	2026-06-01 10:44:57.207
\.


--
-- Data for Name: Disbursement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Disbursement" (id, "applicationId", status, "gpsDeviceNo", "gpsInstallImg", "gpsInstallAt", "mortgageStatus", "mortgageImg", "mortgageAt", "disburseAmount", "disburseAccount", "disburseAt", "transactionNo", "voucherUrl", remark, "createdAt", "updatedAt", "tenantId") FROM stdin;
1	1	MORTGAGE_DONE	GPS-DEMO-001	https://example.com/gps/APP-DEMO-0001.jpg	2026-05-29 02:00:00	DONE	https://example.com/mortgage/APP-DEMO-0001.jpg	2026-05-29 03:00:00	115000.00	6222000000000000000	\N	TX-DEMO-0001	\N	待财务确认放款	2026-06-01 02:04:33.419	2026-06-03 10:50:26.075	1
\.


--
-- Data for Name: FileAsset; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FileAsset" (id, "tenantId", "orgId", "businessType", "businessId", "categoryCode", "categoryName", "fileName", "fileUrl", "objectKey", "mimeType", "fileExt", "fileSize", "storageType", status, "uploadedBy", remark, "createdAt", "updatedAt") FROM stdin;
2	1	\N	\N	\N	IMAGE	图片	car-logo.png	/saas/api/uploads/images/202606/dac9b32f-6f53-4049-8af5-18d5ae268231.png	images/202606/dac9b32f-6f53-4049-8af5-18d5ae268231.png	image/png	png	265387	LOCAL	ACTIVE	5	\N	2026-06-02 07:50:26.658	2026-06-02 07:50:26.658
\.


--
-- Data for Name: FlowConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FlowConfig" (id, "tenantId", "orgId", name, "businessType", "nodeCode", "nodeName", "approveLevel", "amountLimit", "timeoutHours", "requireMaterials", "requireApproval", "autoPass", "ruleConfig", status, remark, "createdAt", "updatedAt") FROM stdin;
3	1	4	预审阶段-风控预审	CAR_LOAN	1200	风控预审	1	\N	\N	f	f	t	{"sort": 1200, "executor": "系统自动化", "nodeCode": 1200, "parallel": false, "required": false, "phaseCode": 1000, "phaseName": "预审阶段", "transitions": [{"action": 20, "toNode": 1300}], "initialStatus": 10, "operationSide": "系统"}	ACTIVE	\N	2026-06-02 10:54:14.271	2026-06-05 08:44:48.908
4	1	4	预审阶段-资方预审	CAR_LOAN	1300	资方预审	1	\N	\N	f	t	f	{"sort": 1300, "executor": "资方接口", "nodeCode": 1300, "parallel": false, "required": false, "phaseCode": 1000, "phaseName": "预审阶段", "transitions": [{"action": 20, "toNode": 1400}, {"action": 50, "toNode": 1400}], "initialStatus": 10, "operationSide": "三方接口"}	ACTIVE	\N	2026-06-02 10:54:14.271	2026-06-05 08:44:48.914
5	1	4	补件阶段-资料补充	CAR_LOAN	1400	资料补充	1	\N	\N	t	f	f	{"sort": 1400, "steps": [{"code": "CUSTOMER_INFO", "name": "客户资料", "sort": 1410, "executor": "客户", "required": true, "operationSide": "移动端"}, {"code": "VEHICLE_INFO", "name": "车辆资料", "sort": 1420, "executor": "客户", "required": true, "operationSide": "移动端"}, {"code": "ORDER_INFO", "name": "订单信息", "sort": 1430, "executor": "客户", "required": true, "operationSide": "移动端"}, {"code": "FILE_INFO", "name": "文件信息", "sort": 1440, "executor": "客户", "required": true, "operationSide": "移动端"}], "executor": "客户", "nodeCode": 1400, "parallel": false, "required": false, "phaseCode": 1400, "phaseName": "补件阶段", "transitions": [{"action": 10, "toNode": 2100, "condition": "REQUIRED_TASKS_COMPLETED"}], "initialStatus": 10, "operationSide": "移动端"}	ACTIVE	\N	2026-06-02 10:54:14.271	2026-06-05 08:44:48.92
9	1	4	客户签约-客户签约	CAR_LOAN	4100	客户签约	1	\N	\N	t	f	f	{"sort": 4100, "steps": [{"code": "CONFIRM_AMOUNT", "name": "确认额度", "sort": 4110, "executor": "客户", "operationSide": "移动端"}, {"code": "BIND_CARD", "name": "绑卡", "sort": 4120, "executor": "客户", "operationSide": "移动端"}, {"code": "SIGN_CONTRACT", "name": "合同签约", "sort": 4130, "executor": "客户", "operationSide": "移动端"}, {"code": "GPS_APPOINTMENT", "name": "GPS安装预约", "sort": 4140, "executor": "客户", "operationSide": "移动端"}, {"code": "MORTGAGE", "name": "抵押办理", "sort": 4150, "executor": "客户", "operationSide": "移动端"}], "executor": "客户", "nodeCode": 4100, "parallel": false, "required": false, "phaseCode": 4000, "phaseName": "客户签约", "transitions": [{"action": 10, "toNode": 5100}], "initialStatus": 10, "operationSide": "移动端"}	ACTIVE	\N	2026-06-02 10:54:14.271	2026-06-05 08:44:48.951
18	1	1	预审进件-身份证信息	CAR_LOAN	1100	身份证信息	1	\N	\N	t	f	f	{"sort": 1100, "nodeCode": 1100, "parallel": false, "required": false, "phaseCode": 1000, "phaseName": "预审进件", "transitions": [{"action": 10, "toNode": 1200}], "initialStatus": 10}	ACTIVE	\N	2026-06-02 10:54:14.271	2026-06-03 10:50:25.878
19	1	1	预审进件-车辆信息	CAR_LOAN	1200	车辆信息	1	\N	\N	t	f	f	{"sort": 1200, "nodeCode": 1200, "parallel": false, "required": false, "phaseCode": 1000, "phaseName": "预审进件", "transitions": [{"action": 10, "toNode": 1300}], "initialStatus": 10}	ACTIVE	\N	2026-06-02 10:54:14.271	2026-06-03 10:50:25.885
20	1	1	预审进件-申请信息	CAR_LOAN	1300	申请信息	1	\N	\N	t	f	f	{"sort": 1300, "nodeCode": 1300, "parallel": false, "required": false, "phaseCode": 1000, "phaseName": "预审进件", "transitions": [{"action": 10, "toNode": 1400}], "initialStatus": 10}	ACTIVE	\N	2026-06-02 10:54:14.271	2026-06-03 10:50:25.889
21	1	1	预审进件-签署授权书	CAR_LOAN	1400	签署授权书	1	\N	\N	t	f	f	{"sort": 1400, "nodeCode": 1400, "parallel": false, "required": false, "phaseCode": 1000, "phaseName": "预审进件", "transitions": [{"action": 10, "toNode": 2000}], "initialStatus": 10}	ACTIVE	\N	2026-06-02 10:54:14.271	2026-06-03 10:50:25.892
22	1	1	风控模型预审-风控模型预审	CAR_LOAN	2000	风控模型预审	1	\N	\N	f	f	t	{"sort": 2000, "nodeCode": 2000, "parallel": false, "required": false, "phaseCode": 2000, "phaseName": "风控模型预审", "transitions": [{"action": 20, "toNode": 3000}], "initialStatus": 10}	ACTIVE	\N	2026-06-02 10:54:14.271	2026-06-03 10:50:25.895
23	1	1	资方预审-资方预审	CAR_LOAN	3000	资方预审	1	\N	\N	f	t	f	{"sort": 3000, "nodeCode": 3000, "parallel": false, "required": false, "phaseCode": 3000, "phaseName": "资方预审", "transitions": [{"action": 20, "toNode": 4000}], "initialStatus": 10}	ACTIVE	\N	2026-06-02 10:54:14.271	2026-06-03 10:50:25.898
24	1	1	资料补充-资料补充	CAR_LOAN	4000	资料补充	1	\N	\N	t	f	f	{"sort": 4000, "nodeCode": 4000, "parallel": false, "required": false, "phaseCode": 4000, "phaseName": "资料补充", "transitions": [{"action": 10, "toNode": 5000, "condition": "REQUIRED_TASKS_COMPLETED"}], "initialStatus": 10}	ACTIVE	\N	2026-06-02 10:54:14.271	2026-06-03 10:50:25.902
25	1	1	资料补充-客户资料	CAR_LOAN	4100	客户资料	1	\N	\N	t	f	f	{"sort": 4100, "nodeCode": 4100, "parallel": true, "required": true, "phaseCode": 4000, "phaseName": "资料补充", "parentNode": 4000, "transitions": [], "initialStatus": 0}	ACTIVE	\N	2026-06-02 10:54:14.271	2026-06-03 10:50:25.906
26	1	1	资料补充-车辆资料	CAR_LOAN	4200	车辆资料	1	\N	\N	t	f	f	{"sort": 4200, "nodeCode": 4200, "parallel": true, "required": true, "phaseCode": 4000, "phaseName": "资料补充", "parentNode": 4000, "transitions": [], "initialStatus": 0}	ACTIVE	\N	2026-06-02 10:54:14.271	2026-06-03 10:50:25.91
27	1	1	资料补充-订单信息	CAR_LOAN	4300	订单信息	1	\N	\N	t	f	f	{"sort": 4300, "nodeCode": 4300, "parallel": true, "required": true, "phaseCode": 4000, "phaseName": "资料补充", "parentNode": 4000, "transitions": [], "initialStatus": 0}	ACTIVE	\N	2026-06-02 10:54:14.271	2026-06-03 10:50:25.914
28	1	1	资料补充-文件信息	CAR_LOAN	4400	文件信息	1	\N	\N	t	f	f	{"sort": 4400, "nodeCode": 4400, "parallel": true, "required": true, "phaseCode": 4000, "phaseName": "资料补充", "parentNode": 4000, "transitions": [], "initialStatus": 0}	ACTIVE	\N	2026-06-02 10:54:14.271	2026-06-03 10:50:25.918
29	1	1	风控初审-风控初审	CAR_LOAN	5000	风控初审	1	\N	\N	f	t	f	{"sort": 5000, "nodeCode": 5000, "parallel": false, "required": false, "phaseCode": 5000, "phaseName": "风控初审", "transitions": [{"action": 20, "toNode": 6000}], "initialStatus": 10}	ACTIVE	\N	2026-06-02 10:54:14.271	2026-06-03 10:50:25.922
30	1	1	风控终审-风控终审	CAR_LOAN	6000	风控终审	2	\N	\N	f	t	f	{"sort": 6000, "nodeCode": 6000, "parallel": false, "required": false, "phaseCode": 6000, "phaseName": "风控终审", "transitions": [{"action": 20, "toNode": 7000}], "initialStatus": 10}	ACTIVE	\N	2026-06-02 10:54:14.271	2026-06-03 10:50:25.926
31	1	1	请款资料-请款资料	CAR_LOAN	7000	请款资料	1	\N	\N	t	f	f	{"sort": 7000, "nodeCode": 7000, "parallel": false, "required": false, "phaseCode": 7000, "phaseName": "请款资料", "transitions": [{"action": 10, "toNode": 8000}], "initialStatus": 10}	ACTIVE	\N	2026-06-02 10:54:14.271	2026-06-03 10:50:25.93
32	1	1	资方终审-资方终审	CAR_LOAN	8000	资方终审	1	\N	\N	f	t	f	{"sort": 8000, "nodeCode": 8000, "parallel": false, "required": false, "phaseCode": 8000, "phaseName": "资方终审", "transitions": [{"action": 20, "toNode": 9000}], "initialStatus": 10}	ACTIVE	\N	2026-06-02 10:54:14.271	2026-06-03 10:50:25.933
33	1	1	资方放款-资方放款	CAR_LOAN	9000	资方放款	1	\N	\N	f	f	f	{"sort": 9000, "nodeCode": 9000, "parallel": false, "required": false, "phaseCode": 9000, "phaseName": "资方放款", "transitions": [], "initialStatus": 10}	ACTIVE	\N	2026-06-02 10:54:14.271	2026-06-03 10:50:25.939
2	1	4	预审阶段-预审进件	CAR_LOAN	1100	预审进件	1	\N	\N	t	f	f	{"sort": 1100, "steps": [{"code": "ID_CARD", "name": "身份证信息", "sort": 1110, "executor": "客户/业务员", "required": true, "operationSide": "移动端"}, {"code": "VEHICLE", "name": "车辆信息", "sort": 1120, "executor": "客户/业务员", "required": true, "operationSide": "移动端"}, {"code": "APPLICATION", "name": "申请信息", "sort": 1130, "executor": "客户/业务员", "required": true, "operationSide": "移动端"}, {"code": "AUTH_SIGN", "name": "签署授权书", "sort": 1140, "executor": "客户/业务员", "required": true, "operationSide": "移动端"}], "executor": "客户/业务员", "nodeCode": 1100, "parallel": false, "required": false, "phaseCode": 1000, "phaseName": "预审阶段", "transitions": [{"action": 10, "toNode": 1200}], "initialStatus": 10, "operationSide": "移动端"}	ACTIVE	\N	2026-06-02 10:54:14.271	2026-06-05 08:44:48.887
86	1	4	风控审批-风控初审	CAR_LOAN	2100	风控初审	1	\N	\N	f	t	f	{"sort": 2100, "executor": "风控专员", "nodeCode": 2100, "parallel": false, "required": false, "phaseCode": 2000, "phaseName": "风控审批", "transitions": [{"action": 20, "toNode": 2200}, {"action": 50, "toNode": 1400}], "initialStatus": 10, "operationSide": "Web"}	ACTIVE	\N	2026-06-05 08:44:48.925	2026-06-05 08:44:48.925
87	1	4	风控审批-风控终审	CAR_LOAN	2200	风控终审	2	\N	\N	f	t	f	{"sort": 2200, "executor": "风控主管", "nodeCode": 2200, "parallel": false, "required": false, "phaseCode": 2000, "phaseName": "风控审批", "transitions": [{"action": 20, "toNode": 3100}, {"action": 50, "toNode": 1400}], "initialStatus": 10, "operationSide": "Web"}	ACTIVE	\N	2026-06-05 08:44:48.938	2026-06-05 08:44:48.938
88	1	4	资方终审-资方终审	CAR_LOAN	3100	资方终审	1	\N	\N	f	t	f	{"sort": 3100, "executor": "资方接口", "nodeCode": 3100, "parallel": false, "required": false, "phaseCode": 3000, "phaseName": "资方终审", "transitions": [{"action": 20, "toNode": 4100}, {"action": 50, "toNode": 1400}], "initialStatus": 10, "operationSide": "三方接口"}	ACTIVE	\N	2026-06-05 08:44:48.946	2026-06-05 08:44:48.946
90	1	4	请款放款-请款资料	CAR_LOAN	5100	请款资料	1	\N	\N	t	f	f	{"sort": 5100, "executor": "业务专员", "nodeCode": 5100, "parallel": false, "required": false, "phaseCode": 5000, "phaseName": "请款放款", "transitions": [{"action": 20, "toNode": 6100}], "initialStatus": 10, "operationSide": "Web"}	ACTIVE	\N	2026-06-05 08:44:48.956	2026-06-05 08:44:48.956
91	1	4	请款放款-资方放款	CAR_LOAN	6100	资方放款	1	\N	\N	f	f	f	{"sort": 6100, "executor": "资方接口", "nodeCode": 6100, "parallel": false, "required": false, "phaseCode": 5000, "phaseName": "请款放款", "transitions": [], "initialStatus": 10, "operationSide": "三方接口"}	ACTIVE	\N	2026-06-05 08:44:48.961	2026-06-05 08:44:48.961
\.


--
-- Data for Name: Funder; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Funder" (id, "orgId", name, code, "funderType", "contactName", "contactPhone", "apiConfig", priority, status, "createdAt", "updatedAt", "tenantId", "integrationMode", "creditLimit", "approvalRules") FROM stdin;
1	1	示例银行资金方	DEMO_BANK	BANK	李经理	13810000001	\N	1	ACTIVE	2026-06-01 02:04:33.308	2026-06-03 10:50:25.967	1	MANUAL	\N	\N
\.


--
-- Data for Name: Lead; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Lead" (id, "orgId", source, name, phone, "idCard", "carBrand", "carModel", "loanAmount", remark, status, "assigneeId", "nextFollowAt", "createdBy", "createdAt", "updatedAt", "tenantId") FROM stdin;
1	1	SELF	王小明	13910000001	110101199001010011	大众	迈腾	120000.00	客户计划置换经营周转资金	FOLLOWING	1	2026-06-01 02:00:00	1	2026-06-01 02:04:33.322	2026-06-03 10:50:25.981	1
\.


--
-- Data for Name: LeadFollowUp; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LeadFollowUp" (id, "leadId", "followType", content, "nextFollowAt", "createdBy", "createdAt") FROM stdin;
1	1	PHONE	客户已提交车辆资料，准备转进件。	2026-06-01 02:00:00	1	2026-06-01 02:04:33.366
\.


--
-- Data for Name: Menu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Menu" (id, "parentId", path, name, component, title, icon, sort, "keepAlive", hidden, "hiddenTab", link, iframe, "createdAt", "updatedAt", "tenantId") FROM stdin;
33	\N	/business	Business	/index/index	业务管理	ri:briefcase-line	60	f	f	f	\N	f	2026-06-01 09:43:04.186	2026-06-15 03:55:45.221	1
34	33	org	Org	/business/common-list	机构管理	ri:building-line	61	t	t	t	\N	f	2026-06-01 09:43:04.191	2026-06-15 03:55:45.221	1
35	33	dept	Dept	/business/common-list	部门管理	ri:organization-chart	62	t	t	t	\N	f	2026-06-01 09:43:04.194	2026-06-15 03:55:45.221	1
36	33	product	Product	/business/common-list	产品配置	ri:file-list-line	63	t	t	t	\N	f	2026-06-01 09:43:04.199	2026-06-15 03:55:45.221	1
37	33	funder	Funder	/business/common-list	资方配置	ri:bank-line	64	t	t	t	\N	f	2026-06-01 09:43:04.203	2026-06-15 03:55:45.221	1
38	33	flow-config	FlowConfig	/business/flow-config	流程与规则	ri:git-branch-line	65	t	t	t	\N	f	2026-06-01 09:43:04.207	2026-06-15 03:55:45.221	1
46	33	repayment	Repayment	/business/common-list	还款管理	ri:refund-line	74	t	t	t	\N	f	2026-06-01 09:43:04.239	2026-06-15 03:55:45.221	1
47	33	pawn	PawnBusiness	/business/common-list	典当业务	ri:swap-box-line	75	t	t	t	\N	f	2026-06-01 09:43:04.244	2026-06-15 03:55:45.221	1
48	33	reports	Reports	/business/common-list	报表统计	ri:pie-chart-line	76	t	t	t	\N	f	2026-06-01 09:43:04.248	2026-06-15 03:55:45.221	1
49	33	org-config	OrgConfig	/business/common-list	机构配置	ri:tools-line	76	t	t	t	\N	f	2026-06-01 09:43:04.252	2026-06-15 03:55:45.221	1
173	33	order-query	BusinessOrderQuery	/business/common-list	综合查询	ri:search-eye-line	69	t	t	t	\N	f	2026-06-15 02:12:49.925	2026-06-15 03:55:45.221	1
18	12	work-order	WorkOrder	/business/common-list	运营工单中心	ri:customer-service-2-line	26	t	f	f	\N	f	2026-06-01 09:43:04.123	2026-06-15 03:55:45.221	1
19	\N	/datacenter	DataCenter	/index/index	数据中心	ri:bar-chart-box-line	30	f	f	f	\N	f	2026-06-01 09:43:04.129	2026-06-15 03:55:45.221	1
20	19	stats	DataStats	/business/common-list	数据统计	ri:bar-chart-line	31	t	f	f	\N	f	2026-06-01 09:43:04.133	2026-06-15 03:55:45.221	1
21	19	audit-log	AuditLog	/business/common-list	日志审计	ri:file-list-3-line	32	t	f	f	\N	f	2026-06-01 09:43:04.138	2026-06-15 03:55:45.221	1
4	\N	/system	System	/index/index	系统管理	ri:settings-3-line	40	f	f	f	\N	f	2026-05-27 01:11:44.538	2026-06-15 03:55:45.221	1
1	\N	/dashboard	Dashboard	/index/index	仪表盘	ri:dashboard-line	10	f	f	f	\N	f	2026-05-27 01:11:44.525	2026-06-15 03:55:45.221	1
2	1	console	Console	/dashboard/console	工作台	ri:computer-line	11	t	f	f	\N	f	2026-05-27 01:11:44.53	2026-06-15 03:55:45.221	1
3	1	analysis	Analysis	/dashboard/analysis	分析页	ri:line-chart-line	12	t	f	f	\N	f	2026-05-27 01:11:44.534	2026-06-15 03:55:45.221	1
12	\N	/platform	Platform	/index/index	平台管理	ri:global-line	20	f	f	f	\N	f	2026-06-01 09:43:04.097	2026-06-15 03:55:45.221	1
13	12	tenant	TenantMgmt	/business/common-list	租户机构管理	ri:building-2-line	21	t	f	f	\N	f	2026-06-01 09:43:04.101	2026-06-15 03:55:45.221	1
14	12	package-billing	PackageBilling	/business/common-list	套餐与计费	ri:money-dollar-circle-line	22	t	f	f	\N	f	2026-06-01 09:43:04.106	2026-06-15 03:55:45.221	1
15	12	product-template	ProductTemplate	/business/common-list	产品与资方模板	ri:file-copy-line	23	t	f	f	\N	f	2026-06-01 09:43:04.11	2026-06-15 03:55:45.221	1
16	12	supervision	PlatformSupervision	/business/common-list	平台业务监管	ri:eye-line	24	t	f	f	\N	f	2026-06-01 09:43:04.115	2026-06-15 03:55:45.221	1
17	12	third-party	ThirdPartyService	/business/common-list	第三方服务管理	ri:plug-line	25	t	f	f	\N	f	2026-06-01 09:43:04.119	2026-06-15 03:55:45.221	1
5	4	user	User	/system/user	用户管理	ri:user-line	41	t	f	f	\N	f	2026-05-27 01:11:44.541	2026-06-15 03:55:45.221	1
6	4	role	Role	/system/role	角色管理	ri:user-settings-line	42	t	f	f	\N	f	2026-05-27 01:11:44.545	2026-06-15 03:55:45.221	1
7	4	menu	Menus	/system/menu	菜单管理	ri:menu-line	43	t	f	f	\N	f	2026-05-27 01:11:44.548	2026-06-15 03:55:45.221	1
26	4	dict	DictMgmt	/system/dict	字典管理	ri:book-open-line	44	t	f	f	\N	f	2026-06-01 09:43:04.159	2026-06-15 03:55:45.221	1
27	4	region	RegionMgmt	/business/common-list	地区管理	ri:map-pin-line	45	t	f	f	\N	f	2026-06-01 09:43:04.163	2026-06-15 03:55:45.221	1
28	4	file-config	FileConfig	/system/file-config	文件存储配置	ri:hard-drive-2-line	47	t	f	f	\N	f	2026-06-01 09:43:04.167	2026-06-15 03:55:45.221	1
29	4	msg-template	MsgTemplate	/business/common-list	消息模板	ri:mail-send-line	48	t	f	f	\N	f	2026-06-01 09:43:04.171	2026-06-15 03:55:45.221	1
30	4	sys-param	SysParam	/business/common-list	系统参数	ri:settings-line	49	t	f	f	\N	f	2026-06-01 09:43:04.175	2026-06-15 03:55:45.221	1
31	4	notice	Notice	/business/common-list	公告管理	ri:notification-line	50	t	f	f	\N	f	2026-06-01 09:43:04.178	2026-06-15 03:55:45.221	1
8	4	user-center	UserCenter	/business/common-list	用户中心	ri:user-line	51	t	t	t	\N	f	2026-05-29 02:37:47.634	2026-06-15 03:55:45.221	1
133	33	precheck	BusinessPrecheck	/business/common-list	预审阶段	ri:file-search-line	61	t	f	f	\N	f	2026-06-05 09:33:11.455	2026-06-15 03:55:45.221	1
134	33	supplement	BusinessSupplement	/business/common-list	补件阶段	ri:folder-upload-line	62	t	f	f	\N	f	2026-06-05 09:33:11.455	2026-06-15 03:55:45.221	1
135	33	risk-approval	BusinessRiskApproval	/business/common-list	风控审批	ri:shield-check-line	63	t	f	f	\N	f	2026-06-05 09:33:11.455	2026-06-15 03:55:45.221	1
136	33	funder-final	BusinessFunderFinal	/business/common-list	资方终审	ri:bank-line	64	t	f	f	\N	f	2026-06-05 09:33:11.455	2026-06-15 03:55:45.221	1
137	33	signing	BusinessSigning	/business/common-list	客户签约	ri:contract-line	65	t	f	f	\N	f	2026-06-05 09:33:11.455	2026-06-15 03:55:45.221	1
138	33	disbursement	BusinessDisbursement	/business/common-list	请款放款	ri:money-cny-circle-line	66	t	f	f	\N	f	2026-06-05 09:33:11.455	2026-06-15 03:55:45.221	1
132	4	file	FileManage	/system/file	文件管理	ri:file-list-3-line	46	t	f	f	\N	f	2026-06-02 13:34:12.196	2026-06-15 03:55:45.221	1
39	33	lead	Lead	/business/common-list	线索管理	ri:customer-service-line	66	t	t	t	\N	f	2026-06-01 09:43:04.211	2026-06-15 03:55:45.221	1
40	33	customer	Customer	/business/common-list	客户管理	ri:contacts-line	67	t	t	t	\N	f	2026-06-01 09:43:04.214	2026-06-15 03:55:45.221	1
41	33	application	Application	/business/common-list	进件管理	ri:file-edit-line	68	t	t	t	\N	f	2026-06-01 09:43:04.219	2026-06-15 03:55:45.221	1
42	33	approval	Approval	/business/common-list	审批管理	ri:shield-check-line	70	t	t	t	\N	f	2026-06-01 09:43:04.223	2026-06-15 03:55:45.221	1
43	33	signing	Signing	/business/common-list	签约管理	ri:pen-nib-line	71	t	t	t	\N	f	2026-06-01 09:43:04.227	2026-06-15 03:55:45.221	1
44	33	disbursement	Disbursement	/business/common-list	放款管理	ri:money-cny-circle-line	72	t	t	t	\N	f	2026-06-01 09:43:04.231	2026-06-15 03:55:45.221	1
45	33	order	OrderMgmt	/business/common-list	订单管理	ri:file-list-2-line	73	t	t	t	\N	f	2026-06-01 09:43:04.235	2026-06-15 03:55:45.221	1
\.


--
-- Data for Name: OperationLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OperationLog" (id, "orgId", "userId", "userName", module, action, description, "requestData", "responseData", ip, "userAgent", "createdAt", "tenantId") FROM stdin;
1	\N	\N	\N	auth	POST	POST /saas/api/auth/login 200 87ms	{"body": {"password": "***", "userName": "Super"}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"token": "***", "refreshToken": "***"}}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.26100.8521	2026-06-05 09:21:35.688	\N
2	\N	\N	\N	auth	POST	POST /saas/api/auth/login 200 70ms	{"body": {"password": "***", "userName": "Super"}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"token": "***", "refreshToken": "***"}}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.26100.8521	2026-06-05 09:21:50.542	\N
3	\N	5	Super	data-center	GET	GET /saas/api/data-center/stats 200 86ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"phases": [{"code": 1000, "name": "预审阶段", "count": 0}, {"code": 1400, "name": "补件阶段", "count": 0}, {"code": 2000, "name": "风控审批", "count": 0}, {"code": 3000, "name": "资方终审", "count": 0}, {"code": 4000, "name": "客户签约", "count": 0}, {"code": 5000, "name": "请款放款", "count": 0}], "trends": [{"day": "2026-06-01", "count": 1, "amount": 120000}, {"day": "2026-06-03", "count": 1, "amount": 300000}], "funders": [{"id": 1, "name": "示例银行资金方", "count": 2, "amount": 420000}], "overview": {"passRate": 0, "leadTotal": 1, "customerTotal": 2, "rejectedCount": 0, "approvedAmount": 115000, "disbursedCount": 0, "disbursedAmount": 0, "requestedAmount": 420000, "applicationTotal": 2, "activeFunderTotal": 1, "activeProductTotal": 1, "pendingRepaymentAmount": 5424.17}, "products": [{"id": 1, "name": "标准车抵贷", "count": 2, "amount": 420000}], "statuses": [{"count": 1, "status": "SUBMITTED"}, {"count": 1, "status": "PENDING_DISBURSEMENT"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.26100.8521	2026-06-05 09:21:50.647	\N
4	\N	5	Super	user	GET	GET /saas/api/user/info 200 20ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"email": "super@example.com", "roles": ["R_SUPER"], "avatar": null, "userId": 5, "buttons": [], "userName": "Super"}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:22:11.921	\N
5	\N	5	Super	v3	GET	GET /saas/api/v3/system/menus 200 41ms	{"body": {}, "query": {}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":[{\\"id\\":1,\\"parentId\\":null,\\"path\\":\\"/dashboard\\",\\"name\\":\\"Dashboard\\",\\"component\\":\\"/index/index\\",\\"meta\\":{\\"title\\":\\"仪表盘\\",\\"icon\\":\\"ri:dashboard-line\\",\\"sort\\":10,\\"keepAlive\\":false,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]},\\"children\\":[{\\"id\\":2,\\"parentId\\":1,\\"path\\":\\"console\\",\\"name\\":\\"Console\\",\\"component\\":\\"/dashboard/console\\",\\"meta\\":{\\"title\\":\\"工作台\\",\\"icon\\":\\"ri:computer-line\\",\\"sort\\":11,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]}},{\\"id\\":3,\\"parentId\\":1,\\"path\\":\\"analysis\\",\\"name\\":\\"Analysis\\",\\"component\\":\\"/dashboard/analysis\\",\\"meta\\":{\\"title\\":\\"分析页\\",\\"icon\\":\\"ri:line-chart-line\\",\\"sort\\":12,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]}}]},{\\"id\\":24,\\"parentId\\":null,\\"path\\":\\"/platform\\",\\"name\\":\\"Platform\\",\\"component\\":\\"/index/index\\",\\"meta\\":{\\"title\\":\\"平台管理\\",\\"icon\\":\\"ri:global-line\\",\\"sort\\":20,\\"keepAlive\\":false,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SALES_MANAGER\\",\\"R_ADMIN\\",\\"R_SUPER\\",\\"R_OPERATION\\"],\\"authList\\":[]},\\"children\\":[{\\"id\\":25,\\"parentId\\":24,\\"path\\":\\"tenant\\",\\"name\\":\\"TenantMgmt\\",\\"component\\":\\"/business/common-list\\",\\"meta\\":{\\"title\\":\\"租户机构管理\\",\\"icon\\":\\"ri:building-2-line\\",\\"sort\\":21,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\"],\\"authList\\":[{\\"id\\":37,\\"title\\":\\"Add\\",\\"authMark\\":\\"add\\",\\"roles\\":[]},{\\"id\\":38,\\"title\\":\\"Edit\\",\\"authMark\\":\\"edit\\",\\"roles\\":[]},{\\"id\\":39,\\"title\\":\\"Delete\\",\\"authMark\\":\\"delete\\",\\"roles\\":[]}]}},{\\"id\\":26,\\"parentId\\":24,\\"path\\":\\"package-billing\\",\\"name\\":\\"PackageBilling\\",\\"component", "truncated": true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:22:12	\N
6	\N	5	Super	file	GET	GET /saas/api/file/list?current=1&size=20 200 12ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":68,\\"tenantId\\":1,\\"orgId\\":1,\\"businessType\\":\\"MOBILE\\",\\"businessId\\":5,\\"categoryCode\\":\\"IMAGE\\",\\"categoryName\\":\\"图片\\",\\"fileName\\":\\"王驰_2055_4130.jpg\\",\\"fileUrl\\":\\"/saas/api/uploads/images/202606/cf17544d-bc88-4238-835a-a9291e321e38.jpg\\",\\"objectKey\\":\\"images/202606/cf17544d-bc88-4238-835a-a9291e321e38.jpg\\",\\"mimeType\\":\\"image/jpeg\\",\\"fileExt\\":\\"jpg\\",\\"fileSize\\":285237,\\"storageType\\":\\"LOCAL\\",\\"status\\":\\"ACTIVE\\",\\"uploadedBy\\":5,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"url\\":\\"/saas/api/uploads/images/202606/cf17544d-bc88-4238-835a-a9291e321e38.jpg\\",\\"previewUrl\\":\\"/saas/api/uploads/images/202606/cf17544d-bc88-4238-835a-a9291e321e38.jpg\\",\\"fileKey\\":\\"images/202606/cf17544d-bc88-4238-835a-a9291e321e38.jpg\\"},{\\"id\\":67,\\"tenantId\\":1,\\"orgId\\":1,\\"businessType\\":\\"MOBILE\\",\\"businessId\\":5,\\"categoryCode\\":\\"IMAGE\\",\\"categoryName\\":\\"图片\\",\\"fileName\\":\\"王驰_2055_4130.jpg\\",\\"fileUrl\\":\\"/saas/api/uploads/images/202606/119ec80a-0ce8-4237-a56d-16f0bcad7015.jpg\\",\\"objectKey\\":\\"images/202606/119ec80a-0ce8-4237-a56d-16f0bcad7015.jpg\\",\\"mimeType\\":\\"image/jpeg\\",\\"fileExt\\":\\"jpg\\",\\"fileSize\\":285237,\\"storageType\\":\\"LOCAL\\",\\"status\\":\\"ACTIVE\\",\\"uploadedBy\\":5,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"url\\":\\"/saas/api/uploads/images/202606/119ec80a-0ce8-4237-a56d-16f0bcad7015.jpg\\",\\"previewUrl\\":\\"/saas/api/uploads/images/202606/119ec80a-0ce8-4237-a56d-16f0bcad7015.jpg\\",\\"fileKey\\":\\"images/202606/119ec80a-0ce8-4237-a56d-16f0bcad7015.jpg\\"},{\\"id\\":66,\\"tenantId\\":1,\\"orgId\\":1,\\"businessType\\":\\"MOBILE\\",\\"businessId\\":5,\\"categoryCode\\":\\"IMAGE\\",\\"categoryName\\":\\"图片\\",\\"fileName\\":\\"王驰_2055_4130.jpg\\",\\"fileUrl\\":\\"/saas/api/uploads/images/202606/69460a21-0610-4858-af98-0a9c9e4de0b1.jpg\\",\\"objectKey\\":\\"images/202606/69460a21-0610-4858-af98-0a9c9e4de0b1.jpg\\",\\"mimeType\\":\\"image/jpeg\\",\\"fileExt\\":\\"jpg\\",\\"fileSize\\":285237,\\"storageType\\":\\"LOCAL\\",\\"status\\":\\"ACTIVE\\",\\"uploadedBy\\":5,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"url\\":\\"/saas/api/uploads/images/202606/69460a21-0610-4858-af98-0a9c9e4de0b1.jpg\\",\\"previewUrl\\":\\"/saas/api/uploads/i", "truncated": true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:22:12.302	\N
7	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=1000 200 12ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "1000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:22:16.493	\N
8	\N	5	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 20ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 2, "current": 1, "records": [{"id": 4, "code": "CAR_LOAN", "name": "车贷机构", "_count": {"funders": 0, "products": 0, "customers": 0, "departments": 1, "applications": 0}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, {"id": 1, "code": "DEMO_ORG", "name": "示例车贷机构", "_count": {"funders": 1, "products": 1, "customers": 2, "departments": 2, "applications": 2}, "status": "ACTIVE", "address": "北京市朝阳区示例路 100 号", "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": "91110000DEMO000001", "contactName": "张经理", "packageType": "STANDARD", "contactPhone": "13810000000"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:22:16.497	\N
9	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=1000 200 11ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "1000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:22:16.512	\N
11	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=5000 200 10ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "5000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:22:18.826	\N
10	\N	5	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 11ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 2, "current": 1, "records": [{"id": 4, "code": "CAR_LOAN", "name": "车贷机构", "_count": {"funders": 0, "products": 0, "customers": 0, "departments": 1, "applications": 0}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, {"id": 1, "code": "DEMO_ORG", "name": "示例车贷机构", "_count": {"funders": 1, "products": 1, "customers": 2, "departments": 2, "applications": 2}, "status": "ACTIVE", "address": "北京市朝阳区示例路 100 号", "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": "91110000DEMO000001", "contactName": "张经理", "packageType": "STANDARD", "contactPhone": "13810000000"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:22:18.824	\N
15	\N	5	Super	data-center	GET	GET /saas/api/data-center/stats 200 34ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"phases": [{"code": 1000, "name": "预审阶段", "count": 0}, {"code": 1400, "name": "补件阶段", "count": 0}, {"code": 2000, "name": "风控审批", "count": 0}, {"code": 3000, "name": "资方终审", "count": 0}, {"code": 4000, "name": "客户签约", "count": 0}, {"code": 5000, "name": "请款放款", "count": 0}], "trends": [{"day": "2026-06-01", "count": 1, "amount": 120000}, {"day": "2026-06-03", "count": 1, "amount": 300000}], "funders": [{"id": 1, "name": "示例银行资金方", "count": 2, "amount": 420000}], "overview": {"passRate": 0, "leadTotal": 1, "customerTotal": 2, "rejectedCount": 0, "approvedAmount": 115000, "disbursedCount": 0, "disbursedAmount": 0, "requestedAmount": 420000, "applicationTotal": 2, "activeFunderTotal": 1, "activeProductTotal": 1, "pendingRepaymentAmount": 5424.17}, "products": [{"id": 1, "name": "标准车抵贷", "count": 2, "amount": 420000}], "statuses": [{"count": 1, "status": "SUBMITTED"}, {"count": 1, "status": "PENDING_DISBURSEMENT"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:22:54.102	\N
12	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=5000 200 7ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "5000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:22:18.84	\N
13	\N	5	Super	application	GET	GET /saas/api/application/list?current=1&size=20 200 23ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":3,\\"tenantId\\":1,\\"orgId\\":1,\\"customerId\\":2,\\"productId\\":1,\\"funderId\\":1,\\"applicationNo\\":\\"APP202606031543330599\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[300000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"repaymentMethod\\":\\"等额本息\\",\\"purpose\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":2000,\\"currentStatus\\":10,\\"creatorId\\":5,\\"sourceLeadId\\":null,\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"remark\\":\\"移动端身份证信息提交自动创建订单草稿\\",\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"示例车贷机构\\",\\"code\\":\\"DEMO_ORG\\",\\"creditCode\\":\\"91110000DEMO000001\\",\\"contactName\\":\\"张经理\\",\\"contactPhone\\":\\"13810000000\\",\\"address\\":\\"北京市朝阳区示例路 100 号\\",\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"customer\\":{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"朱雨贵\\",\\"phone\\":\\"18538529932\\",\\"idCard\\":\\"412823199909044812\\",\\"gender\\":\\"MALE\\",\\"birthDate\\":{},\\"nation\\":\\"1\\",\\"householdAddress\\":\\"河南省遂平县阳丰乡大石桥村大石桥01-376\\",\\"issuingAuthority\\":\\"遂平县公安局\\",\\"idCardValidFrom\\":\\"2019-05-27\\",\\"idCardValidTo\\":\\"2029-05-27\\",\\"idCardFront\\":\\"images/202606/caf45c5e-3956-4c8e-b609-254d6a3d29ee.jpg\\",\\"idCardBack\\":\\"images/202606/632ff110-a769-4ba8-aa70-846be2fa6c52.jpg\\",\\"maritalStatus\\":null,\\"education\\":null,\\"occupation\\":null,\\"companyName\\":null,\\"monthlyIncome\\":null,\\"address\\":\\"河南省遂平县阳丰乡大石桥村大石桥01-376\\",\\"emergencyName\\":null,\\"emergencyPhone\\":null,\\"status\\":\\"ACTIVE\\",\\"createdAt\\":{},\\"updatedAt\\":{}},\\"product\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"标准车抵贷\\",\\"productType\\":\\"CAR_LOAN\\",\\"minRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"maxRate\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[1080000]},\\"minAmount\\":{\\"s\\":1,\\"e\\":4,\\"d\\":[50000]},\\"maxAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[500000]},\\"minTerm\\":6,\\"maxTerm\\":36,\\"repaymentMethod\\":\\"等额本息\\",\\"minAge\\":22,\\"maxAge\\":60,\\"maxCarAge\\":8,\\"maxMileage\\":150000,\\"ltvLimit\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[8000000]},\\"minDownPayment\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[2000000]},\\"regions\\":\\"北京,天津,河北\\",\\"applicableFunders\\":null,\\"accessConditions\\":null,\\"v", "truncated": true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:22:25.648	\N
14	\N	5	Super	application	GET	GET /saas/api/application/list?current=1&size=20 200 13ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":3,\\"tenantId\\":1,\\"orgId\\":1,\\"customerId\\":2,\\"productId\\":1,\\"funderId\\":1,\\"applicationNo\\":\\"APP202606031543330599\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[300000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"repaymentMethod\\":\\"等额本息\\",\\"purpose\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":2000,\\"currentStatus\\":10,\\"creatorId\\":5,\\"sourceLeadId\\":null,\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"remark\\":\\"移动端身份证信息提交自动创建订单草稿\\",\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"示例车贷机构\\",\\"code\\":\\"DEMO_ORG\\",\\"creditCode\\":\\"91110000DEMO000001\\",\\"contactName\\":\\"张经理\\",\\"contactPhone\\":\\"13810000000\\",\\"address\\":\\"北京市朝阳区示例路 100 号\\",\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"customer\\":{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"朱雨贵\\",\\"phone\\":\\"18538529932\\",\\"idCard\\":\\"412823199909044812\\",\\"gender\\":\\"MALE\\",\\"birthDate\\":{},\\"nation\\":\\"1\\",\\"householdAddress\\":\\"河南省遂平县阳丰乡大石桥村大石桥01-376\\",\\"issuingAuthority\\":\\"遂平县公安局\\",\\"idCardValidFrom\\":\\"2019-05-27\\",\\"idCardValidTo\\":\\"2029-05-27\\",\\"idCardFront\\":\\"images/202606/caf45c5e-3956-4c8e-b609-254d6a3d29ee.jpg\\",\\"idCardBack\\":\\"images/202606/632ff110-a769-4ba8-aa70-846be2fa6c52.jpg\\",\\"maritalStatus\\":null,\\"education\\":null,\\"occupation\\":null,\\"companyName\\":null,\\"monthlyIncome\\":null,\\"address\\":\\"河南省遂平县阳丰乡大石桥村大石桥01-376\\",\\"emergencyName\\":null,\\"emergencyPhone\\":null,\\"status\\":\\"ACTIVE\\",\\"createdAt\\":{},\\"updatedAt\\":{}},\\"product\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"标准车抵贷\\",\\"productType\\":\\"CAR_LOAN\\",\\"minRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"maxRate\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[1080000]},\\"minAmount\\":{\\"s\\":1,\\"e\\":4,\\"d\\":[50000]},\\"maxAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[500000]},\\"minTerm\\":6,\\"maxTerm\\":36,\\"repaymentMethod\\":\\"等额本息\\",\\"minAge\\":22,\\"maxAge\\":60,\\"maxCarAge\\":8,\\"maxMileage\\":150000,\\"ltvLimit\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[8000000]},\\"minDownPayment\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[2000000]},\\"regions\\":\\"北京,天津,河北\\",\\"applicableFunders\\":null,\\"accessConditions\\":null,\\"v", "truncated": true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:22:25.668	\N
16	\N	5	Super	user	GET	GET /saas/api/user/info 200 22ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"email": "super@example.com", "roles": ["R_SUPER"], "avatar": null, "userId": 5, "buttons": [], "userName": "Super"}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:25:37.563	\N
17	\N	5	Super	v3	GET	GET /saas/api/v3/system/menus 200 30ms	{"body": {}, "query": {}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":[{\\"id\\":1,\\"parentId\\":null,\\"path\\":\\"/dashboard\\",\\"name\\":\\"Dashboard\\",\\"component\\":\\"/index/index\\",\\"meta\\":{\\"title\\":\\"仪表盘\\",\\"icon\\":\\"ri:dashboard-line\\",\\"sort\\":10,\\"keepAlive\\":false,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]},\\"children\\":[{\\"id\\":2,\\"parentId\\":1,\\"path\\":\\"console\\",\\"name\\":\\"Console\\",\\"component\\":\\"/dashboard/console\\",\\"meta\\":{\\"title\\":\\"工作台\\",\\"icon\\":\\"ri:computer-line\\",\\"sort\\":11,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]}},{\\"id\\":3,\\"parentId\\":1,\\"path\\":\\"analysis\\",\\"name\\":\\"Analysis\\",\\"component\\":\\"/dashboard/analysis\\",\\"meta\\":{\\"title\\":\\"分析页\\",\\"icon\\":\\"ri:line-chart-line\\",\\"sort\\":12,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]}}]},{\\"id\\":24,\\"parentId\\":null,\\"path\\":\\"/platform\\",\\"name\\":\\"Platform\\",\\"component\\":\\"/index/index\\",\\"meta\\":{\\"title\\":\\"平台管理\\",\\"icon\\":\\"ri:global-line\\",\\"sort\\":20,\\"keepAlive\\":false,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SALES_MANAGER\\",\\"R_ADMIN\\",\\"R_SUPER\\",\\"R_OPERATION\\"],\\"authList\\":[]},\\"children\\":[{\\"id\\":25,\\"parentId\\":24,\\"path\\":\\"tenant\\",\\"name\\":\\"TenantMgmt\\",\\"component\\":\\"/business/common-list\\",\\"meta\\":{\\"title\\":\\"租户机构管理\\",\\"icon\\":\\"ri:building-2-line\\",\\"sort\\":21,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\"],\\"authList\\":[{\\"id\\":37,\\"title\\":\\"Add\\",\\"authMark\\":\\"add\\",\\"roles\\":[]},{\\"id\\":38,\\"title\\":\\"Edit\\",\\"authMark\\":\\"edit\\",\\"roles\\":[]},{\\"id\\":39,\\"title\\":\\"Delete\\",\\"authMark\\":\\"delete\\",\\"roles\\":[]}]}},{\\"id\\":26,\\"parentId\\":24,\\"path\\":\\"package-billing\\",\\"name\\":\\"PackageBilling\\",\\"component", "truncated": true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:25:37.635	\N
18	\N	5	Super	data-center	GET	GET /saas/api/data-center/stats 200 97ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"phases": [{"code": 1000, "name": "预审阶段", "count": 0}, {"code": 1400, "name": "补件阶段", "count": 0}, {"code": 2000, "name": "风控审批", "count": 0}, {"code": 3000, "name": "资方终审", "count": 0}, {"code": 4000, "name": "客户签约", "count": 0}, {"code": 5000, "name": "请款放款", "count": 0}], "trends": [{"day": "2026-06-01", "count": 1, "amount": 120000}, {"day": "2026-06-03", "count": 1, "amount": 300000}], "funders": [{"id": 1, "name": "示例银行资金方", "count": 2, "amount": 420000}], "overview": {"passRate": 0, "leadTotal": 1, "customerTotal": 2, "rejectedCount": 0, "approvedAmount": 115000, "disbursedCount": 0, "disbursedAmount": 0, "requestedAmount": 420000, "applicationTotal": 2, "activeFunderTotal": 1, "activeProductTotal": 1, "pendingRepaymentAmount": 5424.17}, "products": [{"id": 1, "name": "标准车抵贷", "count": 2, "amount": 420000}], "statuses": [{"count": 1, "status": "SUBMITTED"}, {"count": 1, "status": "PENDING_DISBURSEMENT"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:25:38.03	\N
48	\N	5	Super	m	GET	GET /saas/api/m/statistics/overview 200 0ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 02:56:01.746	\N
19	\N	5	Super	application	GET	GET /saas/api/application/order-list?pageNum=1&pageSize=10 200 144ms	{"body": {}, "query": {"pageNum": "1", "pageSize": "10"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":3,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":2,\\"uuid\\":\\"2\\",\\"customerName\\":\\"朱雨贵\\",\\"personName\\":\\"朱雨贵\\",\\"name\\":\\"朱雨贵\\",\\"phone\\":\\"18538529932\\",\\"telephone\\":\\"18538529932\\",\\"idCard\\":\\"412823199909044812\\",\\"vehicleId\\":2,\\"plateNumber\\":\\"苏UJ725L\\",\\"vehicleBrand\\":\\"小型轿车\\",\\"vehicleModel\\":\\"宝马牌BMWT200QL（BMW320L\\",\\"vehicleOwner\\":\\"陈发剑\\",\\"applicationNo\\":\\"APP202606031543330599\\",\\"orderNo\\":\\"APP202606031543330599\\",\\"creditOrderId\\":\\"APP202606031543330599\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[300000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":2000,\\"nodeCode\\":2000,\\"currentNodeName\\":\\"风控模型预审\\",\\"nodeName\\":\\"风控模型预审\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":2000,\\"phaseName\\":\\"风控模型预审\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderName\\":\\"示例银行资金方\\",\\"creatorId\\":5,\\"creatorName\\":\\"Super Admin\\",\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"remark\\":\\"移动端身份证信息提交自动创建订单草稿\\",\\"createdAt\\":{},\\"updatedAt\\":{}},{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":1,\\"uuid\\":\\"1\\",\\"customerName\\":\\"王小明\\",\\"personName\\":\\"王小明\\",\\"name\\":\\"王小明\\",\\"phone\\":\\"13910000001\\",\\"telephone\\":\\"13910000001\\",\\"idCard\\":\\"110101199001010011\\",\\"vehicleId\\":1,\\"plateNumber\\":\\"京A12345\\",\\"vehicleBrand\\":\\"大众\\",\\"vehicleModel\\":\\"迈腾\\",\\"vehicleOwner\\":\\"\\",\\"applicationNo\\":\\"APP-DEMO-0001\\",\\"orderNo\\":\\"APP-DEMO-0001\\",\\"creditOrderId\\":\\"APP-DEMO-0001\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[120000]},\\"term\\":24,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[680000]},\\"approvedAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[115000]},\\"approvedTerm\\":24,\\"approvedRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[660000]},\\"status\\":\\"PENDING_DISBURSEMENT\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":7000,\\"nodeCode\\":7000,\\"currentNodeName\\":\\"请款资料\\",\\"nodeName\\":\\"请款资料\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":7000,\\"phaseName\\":\\"请款资料\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderNam", "truncated": true}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-05 09:30:58.794	\N
20	\N	5	Super	m	GET	GET /saas/api/m/statistics/overview 200 0ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-05 09:31:07.972	\N
21	\N	5	Super	user	GET	GET /saas/api/user/info 200 36ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"email": "super@example.com", "roles": ["R_SUPER"], "avatar": null, "userId": 5, "buttons": [], "userName": "Super"}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:36:20.811	\N
22	\N	5	Super	user	GET	GET /saas/api/user/info 200 8ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"email": "super@example.com", "roles": ["R_SUPER"], "avatar": null, "userId": 5, "buttons": [], "userName": "Super"}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:36:20.849	\N
23	\N	5	Super	v3	GET	GET /saas/api/v3/system/menus 200 28ms	{"body": {}, "query": {}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":[{\\"id\\":1,\\"parentId\\":null,\\"path\\":\\"/dashboard\\",\\"name\\":\\"Dashboard\\",\\"component\\":\\"/index/index\\",\\"meta\\":{\\"title\\":\\"仪表盘\\",\\"icon\\":\\"ri:dashboard-line\\",\\"sort\\":10,\\"keepAlive\\":false,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]},\\"children\\":[{\\"id\\":2,\\"parentId\\":1,\\"path\\":\\"console\\",\\"name\\":\\"Console\\",\\"component\\":\\"/dashboard/console\\",\\"meta\\":{\\"title\\":\\"工作台\\",\\"icon\\":\\"ri:computer-line\\",\\"sort\\":11,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]}},{\\"id\\":3,\\"parentId\\":1,\\"path\\":\\"analysis\\",\\"name\\":\\"Analysis\\",\\"component\\":\\"/dashboard/analysis\\",\\"meta\\":{\\"title\\":\\"分析页\\",\\"icon\\":\\"ri:line-chart-line\\",\\"sort\\":12,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]}}]},{\\"id\\":24,\\"parentId\\":null,\\"path\\":\\"/platform\\",\\"name\\":\\"Platform\\",\\"component\\":\\"/index/index\\",\\"meta\\":{\\"title\\":\\"平台管理\\",\\"icon\\":\\"ri:global-line\\",\\"sort\\":20,\\"keepAlive\\":false,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SALES_MANAGER\\",\\"R_ADMIN\\",\\"R_SUPER\\",\\"R_OPERATION\\"],\\"authList\\":[]},\\"children\\":[{\\"id\\":25,\\"parentId\\":24,\\"path\\":\\"tenant\\",\\"name\\":\\"TenantMgmt\\",\\"component\\":\\"/business/common-list\\",\\"meta\\":{\\"title\\":\\"租户机构管理\\",\\"icon\\":\\"ri:building-2-line\\",\\"sort\\":21,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\"],\\"authList\\":[{\\"id\\":37,\\"title\\":\\"Add\\",\\"authMark\\":\\"add\\",\\"roles\\":[]},{\\"id\\":38,\\"title\\":\\"Edit\\",\\"authMark\\":\\"edit\\",\\"roles\\":[]},{\\"id\\":39,\\"title\\":\\"Delete\\",\\"authMark\\":\\"delete\\",\\"roles\\":[]}]}},{\\"id\\":26,\\"parentId\\":24,\\"path\\":\\"package-billing\\",\\"name\\":\\"PackageBilling\\",\\"component", "truncated": true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:36:20.888	\N
24	\N	5	Super	v3	GET	GET /saas/api/v3/system/menus 200 23ms	{"body": {}, "query": {}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":[{\\"id\\":1,\\"parentId\\":null,\\"path\\":\\"/dashboard\\",\\"name\\":\\"Dashboard\\",\\"component\\":\\"/index/index\\",\\"meta\\":{\\"title\\":\\"仪表盘\\",\\"icon\\":\\"ri:dashboard-line\\",\\"sort\\":10,\\"keepAlive\\":false,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]},\\"children\\":[{\\"id\\":2,\\"parentId\\":1,\\"path\\":\\"console\\",\\"name\\":\\"Console\\",\\"component\\":\\"/dashboard/console\\",\\"meta\\":{\\"title\\":\\"工作台\\",\\"icon\\":\\"ri:computer-line\\",\\"sort\\":11,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]}},{\\"id\\":3,\\"parentId\\":1,\\"path\\":\\"analysis\\",\\"name\\":\\"Analysis\\",\\"component\\":\\"/dashboard/analysis\\",\\"meta\\":{\\"title\\":\\"分析页\\",\\"icon\\":\\"ri:line-chart-line\\",\\"sort\\":12,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]}}]},{\\"id\\":24,\\"parentId\\":null,\\"path\\":\\"/platform\\",\\"name\\":\\"Platform\\",\\"component\\":\\"/index/index\\",\\"meta\\":{\\"title\\":\\"平台管理\\",\\"icon\\":\\"ri:global-line\\",\\"sort\\":20,\\"keepAlive\\":false,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SALES_MANAGER\\",\\"R_ADMIN\\",\\"R_SUPER\\",\\"R_OPERATION\\"],\\"authList\\":[]},\\"children\\":[{\\"id\\":25,\\"parentId\\":24,\\"path\\":\\"tenant\\",\\"name\\":\\"TenantMgmt\\",\\"component\\":\\"/business/common-list\\",\\"meta\\":{\\"title\\":\\"租户机构管理\\",\\"icon\\":\\"ri:building-2-line\\",\\"sort\\":21,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\"],\\"authList\\":[{\\"id\\":37,\\"title\\":\\"Add\\",\\"authMark\\":\\"add\\",\\"roles\\":[]},{\\"id\\":38,\\"title\\":\\"Edit\\",\\"authMark\\":\\"edit\\",\\"roles\\":[]},{\\"id\\":39,\\"title\\":\\"Delete\\",\\"authMark\\":\\"delete\\",\\"roles\\":[]}]}},{\\"id\\":26,\\"parentId\\":24,\\"path\\":\\"package-billing\\",\\"name\\":\\"PackageBilling\\",\\"component", "truncated": true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:36:20.93	\N
25	\N	5	Super	data-center	GET	GET /saas/api/data-center/stats 200 88ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"phases": [{"code": 1000, "name": "预审阶段", "count": 0}, {"code": 1400, "name": "补件阶段", "count": 0}, {"code": 2000, "name": "风控审批", "count": 0}, {"code": 3000, "name": "资方终审", "count": 0}, {"code": 4000, "name": "客户签约", "count": 0}, {"code": 5000, "name": "请款放款", "count": 0}], "trends": [{"day": "2026-06-01", "count": 1, "amount": 120000}, {"day": "2026-06-03", "count": 1, "amount": 300000}], "funders": [{"id": 1, "name": "示例银行资金方", "count": 2, "amount": 420000}], "overview": {"passRate": 0, "leadTotal": 1, "customerTotal": 2, "rejectedCount": 0, "approvedAmount": 115000, "disbursedCount": 0, "disbursedAmount": 0, "requestedAmount": 420000, "applicationTotal": 2, "activeFunderTotal": 1, "activeProductTotal": 1, "pendingRepaymentAmount": 5424.17}, "products": [{"id": 1, "name": "标准车抵贷", "count": 2, "amount": 420000}], "statuses": [{"count": 1, "status": "SUBMITTED"}, {"count": 1, "status": "PENDING_DISBURSEMENT"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:36:35.268	\N
26	\N	5	Super	user	GET	GET /saas/api/user/list?current=1&size=20&status=1 200 31ms	{"body": {}, "query": {"size": "20", "status": "1", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":1,\\"avatar\\":\\"\\",\\"status\\":\\"1\\",\\"userName\\":\\"Sales\\",\\"userGender\\":\\"Unknown\\",\\"nickName\\":\\"Sales\\",\\"userPhone\\":\\"13800000003\\",\\"userEmail\\":\\"sales@example.com\\",\\"deptId\\":1,\\"deptName\\":\\"车贷业务一部\\",\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"userRoles\\":[\\"R_SALES\\"],\\"createBy\\":\\"system\\",\\"createTime\\":\\"2026-06-01 02:04:32\\",\\"updateBy\\":\\"system\\",\\"updateTime\\":\\"2026-06-03 10:50:25\\"},{\\"id\\":2,\\"avatar\\":\\"\\",\\"status\\":\\"1\\",\\"userName\\":\\"Finance\\",\\"userGender\\":\\"Unknown\\",\\"nickName\\":\\"Finance\\",\\"userPhone\\":\\"13800000005\\",\\"userEmail\\":\\"finance@example.com\\",\\"deptId\\":null,\\"deptName\\":\\"\\",\\"orgName\\":\\"\\",\\"userRoles\\":[\\"R_FINANCE\\"],\\"createBy\\":\\"system\\",\\"createTime\\":\\"2026-06-01 02:04:32\\",\\"updateBy\\":\\"system\\",\\"updateTime\\":\\"2026-06-03 10:50:25\\"},{\\"id\\":3,\\"avatar\\":\\"\\",\\"status\\":\\"1\\",\\"userName\\":\\"User\\",\\"userGender\\":\\"Unknown\\",\\"nickName\\":\\"User\\",\\"userPhone\\":\\"13800000008\\",\\"userEmail\\":\\"user@example.com\\",\\"deptId\\":null,\\"deptName\\":\\"\\",\\"orgName\\":\\"\\",\\"userRoles\\":[\\"R_USER\\"],\\"createBy\\":\\"system\\",\\"createTime\\":\\"2026-06-01 02:04:32\\",\\"updateBy\\":\\"system\\",\\"updateTime\\":\\"2026-06-03 10:50:25\\"},{\\"id\\":4,\\"avatar\\":\\"\\",\\"status\\":\\"1\\",\\"userName\\":\\"Approver\\",\\"userGender\\":\\"Unknown\\",\\"nickName\\":\\"Approver\\",\\"userPhone\\":\\"13800000004\\",\\"userEmail\\":\\"approver@example.com\\",\\"deptId\\":null,\\"deptName\\":\\"\\",\\"orgName\\":\\"\\",\\"userRoles\\":[\\"R_APPROVER\\"],\\"createBy\\":\\"system\\",\\"createTime\\":\\"2026-06-01 02:04:32\\",\\"updateBy\\":\\"system\\",\\"updateTime\\":\\"2026-06-03 10:50:25\\"},{\\"id\\":5,\\"avatar\\":\\"\\",\\"status\\":\\"1\\",\\"userName\\":\\"Super\\",\\"userGender\\":\\"Male\\",\\"nickName\\":\\"Super Admin\\",\\"userPhone\\":\\"13800000001\\",\\"userEmail\\":\\"super@example.com\\",\\"deptId\\":null,\\"deptName\\":\\"\\",\\"orgName\\":\\"\\",\\"userRoles\\":[\\"R_SUPER\\"],\\"createBy\\":\\"system\\",\\"createTime\\":\\"2026-06-01 02:04:32\\",\\"updateBy\\":\\"system\\",\\"updateTime\\":\\"2026-06-03 10:50:25\\"},{\\"id\\":6,\\"avatar\\":\\"\\",\\"status\\":\\"1\\",\\"userName\\":\\"Admin\\",\\"userGender\\":\\"Female\\",\\"nickName\\":\\"Admin\\",\\"userPhone\\":\\"13800000002\\",\\"userEmail\\":\\"admin@example.com\\",\\"deptId\\":null,\\"deptName\\":\\"\\",\\"orgName\\":\\"\\",\\"userRoles\\":[\\"R_ADMIN\\"],\\"createBy\\":\\"system\\",\\"createTime\\":\\"2026-06-01 02:04:32\\",\\"upd", "truncated": true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:36:42.448	\N
27	\N	5	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 18ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 2, "current": 1, "records": [{"id": 4, "code": "CAR_LOAN", "name": "车贷机构", "_count": {"funders": 0, "products": 0, "customers": 0, "departments": 1, "applications": 0}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, {"id": 1, "code": "DEMO_ORG", "name": "示例车贷机构", "_count": {"funders": 1, "products": 1, "customers": 2, "departments": 2, "applications": 2}, "status": "ACTIVE", "address": "北京市朝阳区示例路 100 号", "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": "91110000DEMO000001", "contactName": "张经理", "packageType": "STANDARD", "contactPhone": "13810000000"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:36:43.426	\N
28	\N	5	Super	dict	GET	GET /saas/api/dict/type/list?current=1&size=20&name=&code= 200 15ms	{"body": {}, "query": {"code": "", "name": "", "size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 2, "current": 1, "records": [{"id": 1, "code": "sex", "name": "性别", "remark": "", "status": "ACTIVE", "itemCount": 2, "createTime": "2026-06-01 10:41:48", "updateTime": "2026-06-01 10:41:48"}, {"id": 4, "code": "if", "name": "是否", "remark": "", "status": "ACTIVE", "itemCount": 2, "createTime": "2026-06-01 10:44:57", "updateTime": "2026-06-01 10:44:57"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:36:47.544	\N
29	\N	5	Super	dict	GET	GET /saas/api/dict/data/list?current=1&size=20&typeId=1&label=&value= 200 12ms	{"body": {}, "query": {"size": "20", "label": "", "value": "", "typeId": "1", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 2, "current": 1, "records": [{"id": 3, "sort": 0, "label": "男", "value": "1", "remark": "", "status": "ACTIVE", "typeId": 1, "typeCode": "sex", "typeName": "性别", "createTime": "2026-06-01 10:45:34", "updateTime": "2026-06-01 10:45:34"}, {"id": 4, "sort": 0, "label": "女", "value": "2", "remark": "", "status": "ACTIVE", "typeId": 1, "typeCode": "sex", "typeName": "性别", "createTime": "2026-06-01 10:45:40", "updateTime": "2026-06-01 10:45:40"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:36:47.578	\N
30	\N	5	Super	file	GET	GET /saas/api/file/list?current=1&size=20 200 15ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":68,\\"tenantId\\":1,\\"orgId\\":1,\\"businessType\\":\\"MOBILE\\",\\"businessId\\":5,\\"categoryCode\\":\\"IMAGE\\",\\"categoryName\\":\\"图片\\",\\"fileName\\":\\"王驰_2055_4130.jpg\\",\\"fileUrl\\":\\"/saas/api/uploads/images/202606/cf17544d-bc88-4238-835a-a9291e321e38.jpg\\",\\"objectKey\\":\\"images/202606/cf17544d-bc88-4238-835a-a9291e321e38.jpg\\",\\"mimeType\\":\\"image/jpeg\\",\\"fileExt\\":\\"jpg\\",\\"fileSize\\":285237,\\"storageType\\":\\"LOCAL\\",\\"status\\":\\"ACTIVE\\",\\"uploadedBy\\":5,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"url\\":\\"/saas/api/uploads/images/202606/cf17544d-bc88-4238-835a-a9291e321e38.jpg\\",\\"previewUrl\\":\\"/saas/api/uploads/images/202606/cf17544d-bc88-4238-835a-a9291e321e38.jpg\\",\\"fileKey\\":\\"images/202606/cf17544d-bc88-4238-835a-a9291e321e38.jpg\\"},{\\"id\\":67,\\"tenantId\\":1,\\"orgId\\":1,\\"businessType\\":\\"MOBILE\\",\\"businessId\\":5,\\"categoryCode\\":\\"IMAGE\\",\\"categoryName\\":\\"图片\\",\\"fileName\\":\\"王驰_2055_4130.jpg\\",\\"fileUrl\\":\\"/saas/api/uploads/images/202606/119ec80a-0ce8-4237-a56d-16f0bcad7015.jpg\\",\\"objectKey\\":\\"images/202606/119ec80a-0ce8-4237-a56d-16f0bcad7015.jpg\\",\\"mimeType\\":\\"image/jpeg\\",\\"fileExt\\":\\"jpg\\",\\"fileSize\\":285237,\\"storageType\\":\\"LOCAL\\",\\"status\\":\\"ACTIVE\\",\\"uploadedBy\\":5,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"url\\":\\"/saas/api/uploads/images/202606/119ec80a-0ce8-4237-a56d-16f0bcad7015.jpg\\",\\"previewUrl\\":\\"/saas/api/uploads/images/202606/119ec80a-0ce8-4237-a56d-16f0bcad7015.jpg\\",\\"fileKey\\":\\"images/202606/119ec80a-0ce8-4237-a56d-16f0bcad7015.jpg\\"},{\\"id\\":66,\\"tenantId\\":1,\\"orgId\\":1,\\"businessType\\":\\"MOBILE\\",\\"businessId\\":5,\\"categoryCode\\":\\"IMAGE\\",\\"categoryName\\":\\"图片\\",\\"fileName\\":\\"王驰_2055_4130.jpg\\",\\"fileUrl\\":\\"/saas/api/uploads/images/202606/69460a21-0610-4858-af98-0a9c9e4de0b1.jpg\\",\\"objectKey\\":\\"images/202606/69460a21-0610-4858-af98-0a9c9e4de0b1.jpg\\",\\"mimeType\\":\\"image/jpeg\\",\\"fileExt\\":\\"jpg\\",\\"fileSize\\":285237,\\"storageType\\":\\"LOCAL\\",\\"status\\":\\"ACTIVE\\",\\"uploadedBy\\":5,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"url\\":\\"/saas/api/uploads/images/202606/69460a21-0610-4858-af98-0a9c9e4de0b1.jpg\\",\\"previewUrl\\":\\"/saas/api/uploads/i", "truncated": true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:36:49.106	\N
31	\N	5	Super	file	POST	POST /saas/api/file/batch-delete 200 10ms	{"body": {"ids": [68, 67, 66, 65, 64, 63, 62, 61, 60, 59, 58, 57, 56, 55, 54, 53, 52, 51, 50, 49]}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"ids": [68, 67, 66, 65, 64, 63, 62, 61, 60, 59, 58, 57, 56, 55, 54, 53, 52, 51, 50, 49], "count": 20}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:37:03.894	\N
32	\N	5	Super	file	GET	GET /saas/api/file/list?current=1&size=20 200 8ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":48,\\"tenantId\\":1,\\"orgId\\":1,\\"businessType\\":\\"CUSTOMER\\",\\"businessId\\":2,\\"categoryCode\\":\\"ID_CARD_FRONT\\",\\"categoryName\\":\\"身份证人像面\\",\\"fileName\\":\\"47d8e2df-b8cb-4326-9d21-651a43fcd8b2.jpg\\",\\"fileUrl\\":\\"/saas/api/uploads/images/202606/47d8e2df-b8cb-4326-9d21-651a43fcd8b2.jpg\\",\\"objectKey\\":\\"images/202606/47d8e2df-b8cb-4326-9d21-651a43fcd8b2.jpg\\",\\"mimeType\\":null,\\"fileExt\\":\\"jpg\\",\\"fileSize\\":null,\\"storageType\\":\\"LOCAL\\",\\"status\\":\\"ACTIVE\\",\\"uploadedBy\\":5,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"url\\":\\"/saas/api/uploads/images/202606/47d8e2df-b8cb-4326-9d21-651a43fcd8b2.jpg\\",\\"previewUrl\\":\\"/saas/api/uploads/images/202606/47d8e2df-b8cb-4326-9d21-651a43fcd8b2.jpg\\",\\"fileKey\\":\\"images/202606/47d8e2df-b8cb-4326-9d21-651a43fcd8b2.jpg\\"},{\\"id\\":47,\\"tenantId\\":1,\\"orgId\\":1,\\"businessType\\":\\"MOBILE\\",\\"businessId\\":5,\\"categoryCode\\":\\"IMAGE\\",\\"categoryName\\":\\"图片\\",\\"fileName\\":\\"身份证反.jpg\\",\\"fileUrl\\":\\"/saas/api/uploads/images/202606/785207c7-896a-4a7b-8fc3-604069b80903.jpg\\",\\"objectKey\\":\\"images/202606/785207c7-896a-4a7b-8fc3-604069b80903.jpg\\",\\"mimeType\\":\\"image/jpeg\\",\\"fileExt\\":\\"jpg\\",\\"fileSize\\":299718,\\"storageType\\":\\"LOCAL\\",\\"status\\":\\"ACTIVE\\",\\"uploadedBy\\":5,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"url\\":\\"/saas/api/uploads/images/202606/785207c7-896a-4a7b-8fc3-604069b80903.jpg\\",\\"previewUrl\\":\\"/saas/api/uploads/images/202606/785207c7-896a-4a7b-8fc3-604069b80903.jpg\\",\\"fileKey\\":\\"images/202606/785207c7-896a-4a7b-8fc3-604069b80903.jpg\\"},{\\"id\\":46,\\"tenantId\\":1,\\"orgId\\":1,\\"businessType\\":\\"MOBILE\\",\\"businessId\\":5,\\"categoryCode\\":\\"IMAGE\\",\\"categoryName\\":\\"图片\\",\\"fileName\\":\\"身份证正.jpg\\",\\"fileUrl\\":\\"/saas/api/uploads/images/202606/47d8e2df-b8cb-4326-9d21-651a43fcd8b2.jpg\\",\\"objectKey\\":\\"images/202606/47d8e2df-b8cb-4326-9d21-651a43fcd8b2.jpg\\",\\"mimeType\\":\\"image/jpeg\\",\\"fileExt\\":\\"jpg\\",\\"fileSize\\":311763,\\"storageType\\":\\"LOCAL\\",\\"status\\":\\"ACTIVE\\",\\"uploadedBy\\":5,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"url\\":\\"/saas/api/uploads/images/202606/47d8e2df-b8cb-4326-9d21-651a43fcd8b2.jpg\\",\\"previewUrl\\":\\"/saas/a", "truncated": true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:37:03.921	\N
33	\N	5	Super	file	POST	POST /saas/api/file/batch-delete 200 5ms	{"body": {"ids": [48, 47, 46, 45, 44, 43, 42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29]}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"ids": [48, 47, 46, 45, 44, 43, 42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29], "count": 20}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:37:08.199	\N
34	\N	5	Super	file	GET	GET /saas/api/file/list?current=1&size=20 200 8ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":28,\\"tenantId\\":1,\\"orgId\\":1,\\"businessType\\":\\"CUSTOMER\\",\\"businessId\\":2,\\"categoryCode\\":\\"ID_CARD_FRONT\\",\\"categoryName\\":\\"身份证人像面\\",\\"fileName\\":\\"57a38060-875c-44bc-8ebd-306fa202dfe0.jpg\\",\\"fileUrl\\":\\"/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg\\",\\"objectKey\\":\\"images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg\\",\\"mimeType\\":null,\\"fileExt\\":\\"jpg\\",\\"fileSize\\":null,\\"storageType\\":\\"LOCAL\\",\\"status\\":\\"ACTIVE\\",\\"uploadedBy\\":5,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"url\\":\\"/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg\\",\\"previewUrl\\":\\"/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg\\",\\"fileKey\\":\\"images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg\\"},{\\"id\\":26,\\"tenantId\\":1,\\"orgId\\":1,\\"businessType\\":\\"CUSTOMER\\",\\"businessId\\":2,\\"categoryCode\\":\\"ID_CARD_BACK\\",\\"categoryName\\":\\"身份证国徽面\\",\\"fileName\\":\\"b7104d18-821c-4660-9730-0d99c7f63168.jpg\\",\\"fileUrl\\":\\"/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg\\",\\"objectKey\\":\\"images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg\\",\\"mimeType\\":null,\\"fileExt\\":\\"jpg\\",\\"fileSize\\":null,\\"storageType\\":\\"LOCAL\\",\\"status\\":\\"ACTIVE\\",\\"uploadedBy\\":5,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"url\\":\\"/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg\\",\\"previewUrl\\":\\"/saas/api/uploads/images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg\\",\\"fileKey\\":\\"images/202606/b7104d18-821c-4660-9730-0d99c7f63168.jpg\\"},{\\"id\\":25,\\"tenantId\\":1,\\"orgId\\":1,\\"businessType\\":\\"CUSTOMER\\",\\"businessId\\":2,\\"categoryCode\\":\\"ID_CARD_FRONT\\",\\"categoryName\\":\\"身份证人像面\\",\\"fileName\\":\\"57a38060-875c-44bc-8ebd-306fa202dfe0.jpg\\",\\"fileUrl\\":\\"/saas/api/uploads/images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg\\",\\"objectKey\\":\\"images/202606/57a38060-875c-44bc-8ebd-306fa202dfe0.jpg\\",\\"mimeType\\":null,\\"fileExt\\":\\"jpg\\",\\"fileSize\\":null,\\"storageType\\":\\"LOCAL\\",\\"status\\":\\"ACTIVE\\",\\"uploadedBy\\":5,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"url\\":\\"/saas/api/uploads/images", "truncated": true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:37:08.22	\N
35	\N	5	Super	file	POST	POST /saas/api/file/batch-delete 200 6ms	{"body": {"ids": [28, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8]}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"ids": [28, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8], "count": 20}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:37:21.027	\N
36	\N	5	Super	file	GET	GET /saas/api/file/list?current=1&size=20 200 8ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":7,\\"tenantId\\":1,\\"orgId\\":1,\\"businessType\\":\\"MOBILE\\",\\"businessId\\":5,\\"categoryCode\\":\\"IMAGE\\",\\"categoryName\\":\\"图片\\",\\"fileName\\":\\"身份证正.jpg\\",\\"fileUrl\\":\\"/saas/api/uploads/images/202606/28336321-7f17-470c-bf97-db11e2a344d2.jpg\\",\\"objectKey\\":\\"images/202606/28336321-7f17-470c-bf97-db11e2a344d2.jpg\\",\\"mimeType\\":\\"image/jpeg\\",\\"fileExt\\":\\"jpg\\",\\"fileSize\\":311763,\\"storageType\\":\\"LOCAL\\",\\"status\\":\\"ACTIVE\\",\\"uploadedBy\\":5,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"url\\":\\"/saas/api/uploads/images/202606/28336321-7f17-470c-bf97-db11e2a344d2.jpg\\",\\"previewUrl\\":\\"/saas/api/uploads/images/202606/28336321-7f17-470c-bf97-db11e2a344d2.jpg\\",\\"fileKey\\":\\"images/202606/28336321-7f17-470c-bf97-db11e2a344d2.jpg\\"},{\\"id\\":6,\\"tenantId\\":1,\\"orgId\\":1,\\"businessType\\":\\"MOBILE\\",\\"businessId\\":5,\\"categoryCode\\":\\"IMAGE\\",\\"categoryName\\":\\"图片\\",\\"fileName\\":\\"身份证正.jpg\\",\\"fileUrl\\":\\"/saas/api/uploads/images/202606/22bb27a4-e8f9-4040-ba9a-51a0edc18dfc.jpg\\",\\"objectKey\\":\\"images/202606/22bb27a4-e8f9-4040-ba9a-51a0edc18dfc.jpg\\",\\"mimeType\\":\\"image/jpeg\\",\\"fileExt\\":\\"jpg\\",\\"fileSize\\":311763,\\"storageType\\":\\"LOCAL\\",\\"status\\":\\"ACTIVE\\",\\"uploadedBy\\":5,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"url\\":\\"/saas/api/uploads/images/202606/22bb27a4-e8f9-4040-ba9a-51a0edc18dfc.jpg\\",\\"previewUrl\\":\\"/saas/api/uploads/images/202606/22bb27a4-e8f9-4040-ba9a-51a0edc18dfc.jpg\\",\\"fileKey\\":\\"images/202606/22bb27a4-e8f9-4040-ba9a-51a0edc18dfc.jpg\\"},{\\"id\\":5,\\"tenantId\\":1,\\"orgId\\":1,\\"businessType\\":\\"MOBILE\\",\\"businessId\\":5,\\"categoryCode\\":\\"IMAGE\\",\\"categoryName\\":\\"图片\\",\\"fileName\\":\\"身份证正.jpg\\",\\"fileUrl\\":\\"/saas/api/uploads/images/202606/a84b32b7-fc3a-4cea-89b4-0895efd88168.jpg\\",\\"objectKey\\":\\"images/202606/a84b32b7-fc3a-4cea-89b4-0895efd88168.jpg\\",\\"mimeType\\":\\"image/jpeg\\",\\"fileExt\\":\\"jpg\\",\\"fileSize\\":311763,\\"storageType\\":\\"LOCAL\\",\\"status\\":\\"ACTIVE\\",\\"uploadedBy\\":5,\\"remark\\":null,\\"createdAt\\":{},\\"updatedAt\\":{},\\"url\\":\\"/saas/api/uploads/images/202606/a84b32b7-fc3a-4cea-89b4-0895efd88168.jpg\\",\\"previewUrl\\":\\"/saas/api/uploads/images/202606/a84b32b7-fc3a-", "truncated": true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:37:21.05	\N
37	\N	5	Super	file	POST	POST /saas/api/file/batch-delete 200 8ms	{"body": {"ids": [7, 6, 5, 4, 3]}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"ids": [7, 6, 5, 4, 3], "count": 5}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:37:28.128	\N
38	\N	5	Super	file	GET	GET /saas/api/file/list?current=1&size=20 200 7ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 1, "current": 1, "records": [{"id": 2, "url": "/saas/api/uploads/images/202606/dac9b32f-6f53-4049-8af5-18d5ae268231.png", "orgId": null, "remark": null, "status": "ACTIVE", "fileExt": "png", "fileKey": "images/202606/dac9b32f-6f53-4049-8af5-18d5ae268231.png", "fileUrl": "/saas/api/uploads/images/202606/dac9b32f-6f53-4049-8af5-18d5ae268231.png", "fileName": "car-logo.png", "fileSize": 265387, "mimeType": "image/png", "tenantId": 1, "createdAt": {}, "objectKey": "images/202606/dac9b32f-6f53-4049-8af5-18d5ae268231.png", "updatedAt": {}, "businessId": null, "previewUrl": "/saas/api/uploads/images/202606/dac9b32f-6f53-4049-8af5-18d5ae268231.png", "uploadedBy": 5, "storageType": "LOCAL", "businessType": null, "categoryCode": "IMAGE", "categoryName": "图片"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-05 09:37:28.151	\N
39	\N	\N	\N	auth	POST	POST /saas/api/auth/login 200 262ms	{"body": {"password": "***", "userName": "Super"}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"token": "***", "refreshToken": "***"}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 02:55:41.883	\N
40	\N	5	Super	user	GET	GET /saas/api/user/info 200 43ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"email": "super@example.com", "roles": ["R_SUPER"], "avatar": null, "userId": 5, "buttons": [], "userName": "Super"}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 02:55:41.946	\N
41	\N	5	Super	m	GET	GET /saas/api/m/statistics/overview 200 0ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 02:55:42.962	\N
42	\N	5	Super	m	GET	GET /saas/api/m/statistics/overview 200 0ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 02:55:44.381	\N
43	\N	5	Super	m	GET	GET /saas/api/m/statistics/overview 200 0ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 02:55:46.255	\N
44	\N	5	Super	m	GET	GET /saas/api/m/statistics/overview 200 0ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 02:55:46.692	\N
45	\N	5	Super	m	GET	GET /saas/api/m/statistics/overview 200 1ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 02:55:47.078	\N
46	\N	5	Super	m	GET	GET /saas/api/m/statistics/overview 200 1ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 02:55:54.828	\N
47	\N	5	Super	m	GET	GET /saas/api/m/statistics/overview 200 1ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 02:55:57.64	\N
49	\N	5	Super	application	GET	GET /saas/api/application/order-list?pageNum=1&pageSize=10 200 127ms	{"body": {}, "query": {"pageNum": "1", "pageSize": "10"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":3,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":2,\\"uuid\\":\\"2\\",\\"customerName\\":\\"朱雨贵\\",\\"personName\\":\\"朱雨贵\\",\\"name\\":\\"朱雨贵\\",\\"phone\\":\\"18538529932\\",\\"telephone\\":\\"18538529932\\",\\"idCard\\":\\"412823199909044812\\",\\"vehicleId\\":2,\\"plateNumber\\":\\"苏UJ725L\\",\\"vehicleBrand\\":\\"小型轿车\\",\\"vehicleModel\\":\\"宝马牌BMWT200QL（BMW320L\\",\\"vehicleOwner\\":\\"陈发剑\\",\\"applicationNo\\":\\"APP202606031543330599\\",\\"orderNo\\":\\"APP202606031543330599\\",\\"creditOrderId\\":\\"APP202606031543330599\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[300000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":2000,\\"nodeCode\\":2000,\\"currentNodeName\\":\\"风控模型预审\\",\\"nodeName\\":\\"风控模型预审\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":2000,\\"phaseName\\":\\"风控模型预审\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderName\\":\\"示例银行资金方\\",\\"creatorId\\":5,\\"creatorName\\":\\"Super Admin\\",\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"remark\\":\\"移动端身份证信息提交自动创建订单草稿\\",\\"createdAt\\":{},\\"updatedAt\\":{}},{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":1,\\"uuid\\":\\"1\\",\\"customerName\\":\\"王小明\\",\\"personName\\":\\"王小明\\",\\"name\\":\\"王小明\\",\\"phone\\":\\"13910000001\\",\\"telephone\\":\\"13910000001\\",\\"idCard\\":\\"110101199001010011\\",\\"vehicleId\\":1,\\"plateNumber\\":\\"京A12345\\",\\"vehicleBrand\\":\\"大众\\",\\"vehicleModel\\":\\"迈腾\\",\\"vehicleOwner\\":\\"\\",\\"applicationNo\\":\\"APP-DEMO-0001\\",\\"orderNo\\":\\"APP-DEMO-0001\\",\\"creditOrderId\\":\\"APP-DEMO-0001\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[120000]},\\"term\\":24,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[680000]},\\"approvedAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[115000]},\\"approvedTerm\\":24,\\"approvedRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[660000]},\\"status\\":\\"PENDING_DISBURSEMENT\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":7000,\\"nodeCode\\":7000,\\"currentNodeName\\":\\"请款资料\\",\\"nodeName\\":\\"请款资料\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":7000,\\"phaseName\\":\\"请款资料\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderNam", "truncated": true}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 02:56:05.64	\N
50	\N	5	Super	m	GET	GET /saas/api/m/credit/getCreditDetailByOrderId/APP-DEMO-0001 200 29ms	{"body": {}, "query": {}, "params": {"creditOrderId": "APP-DEMO-0001"}}	{"msg": "success", "code": 200, "data": {"id": 1, "name": "王小明", "uuid": "1", "phone": "13910000001", "remark": "示例进件数据", "status": 1, "periods": 24, "vehicle": {"id": 1, "uuid": "1", "address": null, "mileage": 42000, "sealInfo": null, "isMortgage": 2, "plateNumber": "京A12345", "usageNature": null, "vehicleCode": "Ldemo202605290001", "engineNumber": null, "registerDate": "", "vehicleBrand": "大众", "vehicleColor": "黑色", "vehicleModel": "迈腾", "vehicleOwner": null, "purchasePrice": 21000000, "vehicleImgUrl": ""}, "customer": {"id": 1, "race": null, "uuid": "1", "gender": 1, "nation": null, "telephone": "13910000001", "idcardBack": "", "personName": "王小明", "updateTime": "2026-06-03 18:50:25", "idcardFront": "", "personIdcard": "110101199001010011", "personAddress": "北京市海淀区示例小区 8 号", "personValidDateEnd": null, "personValidDateStart": null, "personIssuingAuthority": null}, "validAmt": "115000.00", "passQuota": "115000.00", "pushQuota": "120000.00", "createTime": "2026-06-01 10:04:33", "updateTime": "2026-06-03 18:50:26", "productName": "标准车抵贷", "businessNode": "LOAN_DISBURSEMENT", "creditOrderId": "APP-DEMO-0001"}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 02:56:42.177	\N
51	\N	5	Super	application	GET	GET /saas/api/application/order-list?pageNum=1&pageSize=10 200 76ms	{"body": {}, "query": {"pageNum": "1", "pageSize": "10"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":3,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":2,\\"uuid\\":\\"2\\",\\"customerName\\":\\"朱雨贵\\",\\"personName\\":\\"朱雨贵\\",\\"name\\":\\"朱雨贵\\",\\"phone\\":\\"18538529932\\",\\"telephone\\":\\"18538529932\\",\\"idCard\\":\\"412823199909044812\\",\\"vehicleId\\":2,\\"plateNumber\\":\\"苏UJ725L\\",\\"vehicleBrand\\":\\"小型轿车\\",\\"vehicleModel\\":\\"宝马牌BMWT200QL（BMW320L\\",\\"vehicleOwner\\":\\"陈发剑\\",\\"applicationNo\\":\\"APP202606031543330599\\",\\"orderNo\\":\\"APP202606031543330599\\",\\"creditOrderId\\":\\"APP202606031543330599\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[300000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":2000,\\"nodeCode\\":2000,\\"currentNodeName\\":\\"风控模型预审\\",\\"nodeName\\":\\"风控模型预审\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":2000,\\"phaseName\\":\\"风控模型预审\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderName\\":\\"示例银行资金方\\",\\"creatorId\\":5,\\"creatorName\\":\\"Super Admin\\",\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"remark\\":\\"移动端身份证信息提交自动创建订单草稿\\",\\"createdAt\\":{},\\"updatedAt\\":{}},{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":1,\\"uuid\\":\\"1\\",\\"customerName\\":\\"王小明\\",\\"personName\\":\\"王小明\\",\\"name\\":\\"王小明\\",\\"phone\\":\\"13910000001\\",\\"telephone\\":\\"13910000001\\",\\"idCard\\":\\"110101199001010011\\",\\"vehicleId\\":1,\\"plateNumber\\":\\"京A12345\\",\\"vehicleBrand\\":\\"大众\\",\\"vehicleModel\\":\\"迈腾\\",\\"vehicleOwner\\":\\"\\",\\"applicationNo\\":\\"APP-DEMO-0001\\",\\"orderNo\\":\\"APP-DEMO-0001\\",\\"creditOrderId\\":\\"APP-DEMO-0001\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[120000]},\\"term\\":24,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[680000]},\\"approvedAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[115000]},\\"approvedTerm\\":24,\\"approvedRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[660000]},\\"status\\":\\"PENDING_DISBURSEMENT\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":7000,\\"nodeCode\\":7000,\\"currentNodeName\\":\\"请款资料\\",\\"nodeName\\":\\"请款资料\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":7000,\\"phaseName\\":\\"请款资料\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderNam", "truncated": true}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 03:14:29.8	\N
52	\N	5	Super	application	GET	GET /saas/api/application/order-list?pageNum=1&pageSize=10 200 26ms	{"body": {}, "query": {"pageNum": "1", "pageSize": "10"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":3,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":2,\\"uuid\\":\\"2\\",\\"customerName\\":\\"朱雨贵\\",\\"personName\\":\\"朱雨贵\\",\\"name\\":\\"朱雨贵\\",\\"phone\\":\\"18538529932\\",\\"telephone\\":\\"18538529932\\",\\"idCard\\":\\"412823199909044812\\",\\"vehicleId\\":2,\\"plateNumber\\":\\"苏UJ725L\\",\\"vehicleBrand\\":\\"小型轿车\\",\\"vehicleModel\\":\\"宝马牌BMWT200QL（BMW320L\\",\\"vehicleOwner\\":\\"陈发剑\\",\\"applicationNo\\":\\"APP202606031543330599\\",\\"orderNo\\":\\"APP202606031543330599\\",\\"creditOrderId\\":\\"APP202606031543330599\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[300000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":2000,\\"nodeCode\\":2000,\\"currentNodeName\\":\\"风控模型预审\\",\\"nodeName\\":\\"风控模型预审\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":2000,\\"phaseName\\":\\"风控模型预审\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderName\\":\\"示例银行资金方\\",\\"creatorId\\":5,\\"creatorName\\":\\"Super Admin\\",\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"remark\\":\\"移动端身份证信息提交自动创建订单草稿\\",\\"createdAt\\":{},\\"updatedAt\\":{}},{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":1,\\"uuid\\":\\"1\\",\\"customerName\\":\\"王小明\\",\\"personName\\":\\"王小明\\",\\"name\\":\\"王小明\\",\\"phone\\":\\"13910000001\\",\\"telephone\\":\\"13910000001\\",\\"idCard\\":\\"110101199001010011\\",\\"vehicleId\\":1,\\"plateNumber\\":\\"京A12345\\",\\"vehicleBrand\\":\\"大众\\",\\"vehicleModel\\":\\"迈腾\\",\\"vehicleOwner\\":\\"\\",\\"applicationNo\\":\\"APP-DEMO-0001\\",\\"orderNo\\":\\"APP-DEMO-0001\\",\\"creditOrderId\\":\\"APP-DEMO-0001\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[120000]},\\"term\\":24,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[680000]},\\"approvedAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[115000]},\\"approvedTerm\\":24,\\"approvedRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[660000]},\\"status\\":\\"PENDING_DISBURSEMENT\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":7000,\\"nodeCode\\":7000,\\"currentNodeName\\":\\"请款资料\\",\\"nodeName\\":\\"请款资料\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":7000,\\"phaseName\\":\\"请款资料\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderNam", "truncated": true}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 03:18:30.997	\N
53	\N	5	Super	m	GET	GET /saas/api/m/credit/getCreditDetailByOrderId/APP202606031543330599 200 65ms	{"body": {}, "query": {}, "params": {"creditOrderId": "APP202606031543330599"}}	{"msg": "success", "code": 200, "data": {"id": 3, "name": "朱雨贵", "uuid": "2", "phone": "18538529932", "remark": "移动端身份证信息提交自动创建订单草稿", "status": 4, "periods": 12, "vehicle": {"id": 2, "uuid": "2", "address": "江苏省苏州市吴中区珠江小区123号楼605室", "mileage": 9000, "sealInfo": "市公安局交通警察支队", "isMortgage": 2, "plateNumber": "苏UJ725L", "usageNature": "非营运", "vehicleCode": "LBV8W3106HMH43140", "engineNumber": "37D168", "registerDate": "2017-07-14", "vehicleBrand": "小型轿车", "vehicleColor": null, "vehicleModel": "宝马牌BMWT200QL（BMW320L", "vehicleOwner": "陈发剑", "vehicleImgUrl": "/saas/api/uploads/images/202606/642c260e-cb5e-48c3-90b1-17511afe86c0.jpg"}, "customer": {"id": 2, "race": "1", "uuid": "2", "gender": 1, "nation": "1", "telephone": "18538529932", "idcardBack": "/saas/api/uploads/images/202606/632ff110-a769-4ba8-aa70-846be2fa6c52.jpg", "personName": "朱雨贵", "updateTime": "2026-06-03 17:46:05", "idcardFront": "/saas/api/uploads/images/202606/caf45c5e-3956-4c8e-b609-254d6a3d29ee.jpg", "personIdcard": "412823199909044812", "personAddress": "河南省遂平县阳丰乡大石桥村大石桥01-376", "personValidDateEnd": "2029-05-27", "personValidDateStart": "2019-05-27", "personIssuingAuthority": "遂平县公安局"}, "pushQuota": "300000.00", "createTime": "2026-06-03 15:43:33", "updateTime": "2026-06-03 17:47:24", "productName": "标准车抵贷", "businessNode": "PRE_AUDIT", "creditOrderId": "APP202606031543330599"}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 03:21:43.882	\N
54	\N	5	Super	m	GET	GET /saas/api/m/statistics/overview 200 0ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 03:23:59.633	\N
55	\N	\N	\N	auth	POST	POST /saas/api/auth/login 200 153ms	{"body": {"password": "***", "userName": "Super"}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"token": "***", "refreshToken": "***"}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:25:32.68	\N
56	\N	5	Super	user	GET	GET /saas/api/user/info 200 17ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"email": "super@example.com", "roles": ["R_SUPER"], "avatar": null, "userId": 5, "buttons": [], "userName": "Super"}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:25:32.72	\N
57	\N	5	Super	v3	GET	GET /saas/api/v3/system/menus 200 64ms	{"body": {}, "query": {}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":[{\\"id\\":1,\\"parentId\\":null,\\"path\\":\\"/dashboard\\",\\"name\\":\\"Dashboard\\",\\"component\\":\\"/index/index\\",\\"meta\\":{\\"title\\":\\"仪表盘\\",\\"icon\\":\\"ri:dashboard-line\\",\\"sort\\":10,\\"keepAlive\\":false,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]},\\"children\\":[{\\"id\\":2,\\"parentId\\":1,\\"path\\":\\"console\\",\\"name\\":\\"Console\\",\\"component\\":\\"/dashboard/console\\",\\"meta\\":{\\"title\\":\\"工作台\\",\\"icon\\":\\"ri:computer-line\\",\\"sort\\":11,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]}},{\\"id\\":3,\\"parentId\\":1,\\"path\\":\\"analysis\\",\\"name\\":\\"Analysis\\",\\"component\\":\\"/dashboard/analysis\\",\\"meta\\":{\\"title\\":\\"分析页\\",\\"icon\\":\\"ri:line-chart-line\\",\\"sort\\":12,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]}}]},{\\"id\\":24,\\"parentId\\":null,\\"path\\":\\"/platform\\",\\"name\\":\\"Platform\\",\\"component\\":\\"/index/index\\",\\"meta\\":{\\"title\\":\\"平台管理\\",\\"icon\\":\\"ri:global-line\\",\\"sort\\":20,\\"keepAlive\\":false,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SALES_MANAGER\\",\\"R_ADMIN\\",\\"R_SUPER\\",\\"R_OPERATION\\"],\\"authList\\":[]},\\"children\\":[{\\"id\\":25,\\"parentId\\":24,\\"path\\":\\"tenant\\",\\"name\\":\\"TenantMgmt\\",\\"component\\":\\"/business/common-list\\",\\"meta\\":{\\"title\\":\\"租户机构管理\\",\\"icon\\":\\"ri:building-2-line\\",\\"sort\\":21,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\"],\\"authList\\":[{\\"id\\":37,\\"title\\":\\"Add\\",\\"authMark\\":\\"add\\",\\"roles\\":[]},{\\"id\\":38,\\"title\\":\\"Edit\\",\\"authMark\\":\\"edit\\",\\"roles\\":[]},{\\"id\\":39,\\"title\\":\\"Delete\\",\\"authMark\\":\\"delete\\",\\"roles\\":[]}]}},{\\"id\\":26,\\"parentId\\":24,\\"path\\":\\"package-billing\\",\\"name\\":\\"PackageBilling\\",\\"component", "truncated": true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:25:32.826	\N
58	\N	5	Super	m	GET	GET /saas/api/m/credit/getCreditDetailByOrderId/APP202606031543330599 200 28ms	{"body": {}, "query": {}, "params": {"creditOrderId": "APP202606031543330599"}}	{"msg": "success", "code": 200, "data": {"id": 3, "name": "朱雨贵", "uuid": "2", "phone": "18538529932", "remark": "移动端身份证信息提交自动创建订单草稿", "status": 4, "periods": 12, "vehicle": {"id": 2, "uuid": "2", "address": "江苏省苏州市吴中区珠江小区123号楼605室", "mileage": 9000, "sealInfo": "市公安局交通警察支队", "isMortgage": 2, "plateNumber": "苏UJ725L", "usageNature": "非营运", "vehicleCode": "LBV8W3106HMH43140", "engineNumber": "37D168", "registerDate": "2017-07-14", "vehicleBrand": "小型轿车", "vehicleColor": null, "vehicleModel": "宝马牌BMWT200QL（BMW320L", "vehicleOwner": "陈发剑", "vehicleImgUrl": "/saas/api/uploads/images/202606/642c260e-cb5e-48c3-90b1-17511afe86c0.jpg"}, "customer": {"id": 2, "race": "1", "uuid": "2", "gender": 1, "nation": "1", "telephone": "18538529932", "idcardBack": "/saas/api/uploads/images/202606/632ff110-a769-4ba8-aa70-846be2fa6c52.jpg", "personName": "朱雨贵", "updateTime": "2026-06-03 17:46:05", "idcardFront": "/saas/api/uploads/images/202606/caf45c5e-3956-4c8e-b609-254d6a3d29ee.jpg", "personIdcard": "412823199909044812", "personAddress": "河南省遂平县阳丰乡大石桥村大石桥01-376", "personValidDateEnd": "2029-05-27", "personValidDateStart": "2019-05-27", "personIssuingAuthority": "遂平县公安局"}, "pushQuota": "300000.00", "createTime": "2026-06-03 15:43:33", "updateTime": "2026-06-03 17:47:24", "productName": "标准车抵贷", "businessNode": "PRE_AUDIT", "creditOrderId": "APP202606031543330599"}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 03:25:39.348	\N
59	\N	5	Super	data-center	GET	GET /saas/api/data-center/stats 200 182ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"phases": [{"code": 1000, "name": "预审阶段", "count": 0}, {"code": 1400, "name": "补件阶段", "count": 0}, {"code": 2000, "name": "风控审批", "count": 0}, {"code": 3000, "name": "资方终审", "count": 0}, {"code": 4000, "name": "客户签约", "count": 0}, {"code": 5000, "name": "请款放款", "count": 0}], "trends": [{"day": "2026-06-01", "count": 1, "amount": 120000}, {"day": "2026-06-03", "count": 1, "amount": 300000}], "funders": [{"id": 1, "name": "示例银行资金方", "count": 2, "amount": 420000}], "overview": {"passRate": 0, "leadTotal": 1, "customerTotal": 2, "rejectedCount": 0, "approvedAmount": 115000, "disbursedCount": 0, "disbursedAmount": 0, "requestedAmount": 420000, "applicationTotal": 2, "activeFunderTotal": 1, "activeProductTotal": 1, "pendingRepaymentAmount": 5424.17}, "products": [{"id": 1, "name": "标准车抵贷", "count": 2, "amount": 420000}], "statuses": [{"count": 1, "status": "SUBMITTED"}, {"count": 1, "status": "PENDING_DISBURSEMENT"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:26:16.987	\N
60	\N	5	Super	user	GET	GET /saas/api/user/list?current=1&size=20&status=1 200 49ms	{"body": {}, "query": {"size": "20", "status": "1", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":1,\\"avatar\\":\\"\\",\\"status\\":\\"1\\",\\"userName\\":\\"Sales\\",\\"userGender\\":\\"Unknown\\",\\"nickName\\":\\"Sales\\",\\"userPhone\\":\\"13800000003\\",\\"userEmail\\":\\"sales@example.com\\",\\"deptId\\":1,\\"deptName\\":\\"车贷业务一部\\",\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"userRoles\\":[\\"R_SALES\\"],\\"createBy\\":\\"system\\",\\"createTime\\":\\"2026-06-01 02:04:32\\",\\"updateBy\\":\\"system\\",\\"updateTime\\":\\"2026-06-03 10:50:25\\"},{\\"id\\":2,\\"avatar\\":\\"\\",\\"status\\":\\"1\\",\\"userName\\":\\"Finance\\",\\"userGender\\":\\"Unknown\\",\\"nickName\\":\\"Finance\\",\\"userPhone\\":\\"13800000005\\",\\"userEmail\\":\\"finance@example.com\\",\\"deptId\\":null,\\"deptName\\":\\"\\",\\"orgName\\":\\"\\",\\"userRoles\\":[\\"R_FINANCE\\"],\\"createBy\\":\\"system\\",\\"createTime\\":\\"2026-06-01 02:04:32\\",\\"updateBy\\":\\"system\\",\\"updateTime\\":\\"2026-06-03 10:50:25\\"},{\\"id\\":3,\\"avatar\\":\\"\\",\\"status\\":\\"1\\",\\"userName\\":\\"User\\",\\"userGender\\":\\"Unknown\\",\\"nickName\\":\\"User\\",\\"userPhone\\":\\"13800000008\\",\\"userEmail\\":\\"user@example.com\\",\\"deptId\\":null,\\"deptName\\":\\"\\",\\"orgName\\":\\"\\",\\"userRoles\\":[\\"R_USER\\"],\\"createBy\\":\\"system\\",\\"createTime\\":\\"2026-06-01 02:04:32\\",\\"updateBy\\":\\"system\\",\\"updateTime\\":\\"2026-06-03 10:50:25\\"},{\\"id\\":4,\\"avatar\\":\\"\\",\\"status\\":\\"1\\",\\"userName\\":\\"Approver\\",\\"userGender\\":\\"Unknown\\",\\"nickName\\":\\"Approver\\",\\"userPhone\\":\\"13800000004\\",\\"userEmail\\":\\"approver@example.com\\",\\"deptId\\":null,\\"deptName\\":\\"\\",\\"orgName\\":\\"\\",\\"userRoles\\":[\\"R_APPROVER\\"],\\"createBy\\":\\"system\\",\\"createTime\\":\\"2026-06-01 02:04:32\\",\\"updateBy\\":\\"system\\",\\"updateTime\\":\\"2026-06-03 10:50:25\\"},{\\"id\\":5,\\"avatar\\":\\"\\",\\"status\\":\\"1\\",\\"userName\\":\\"Super\\",\\"userGender\\":\\"Male\\",\\"nickName\\":\\"Super Admin\\",\\"userPhone\\":\\"13800000001\\",\\"userEmail\\":\\"super@example.com\\",\\"deptId\\":null,\\"deptName\\":\\"\\",\\"orgName\\":\\"\\",\\"userRoles\\":[\\"R_SUPER\\"],\\"createBy\\":\\"system\\",\\"createTime\\":\\"2026-06-01 02:04:32\\",\\"updateBy\\":\\"system\\",\\"updateTime\\":\\"2026-06-03 10:50:25\\"},{\\"id\\":6,\\"avatar\\":\\"\\",\\"status\\":\\"1\\",\\"userName\\":\\"Admin\\",\\"userGender\\":\\"Female\\",\\"nickName\\":\\"Admin\\",\\"userPhone\\":\\"13800000002\\",\\"userEmail\\":\\"admin@example.com\\",\\"deptId\\":null,\\"deptName\\":\\"\\",\\"orgName\\":\\"\\",\\"userRoles\\":[\\"R_ADMIN\\"],\\"createBy\\":\\"system\\",\\"createTime\\":\\"2026-06-01 02:04:32\\",\\"upd", "truncated": true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:26:57.625	\N
61	\N	5	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 27ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 2, "current": 1, "records": [{"id": 4, "code": "CAR_LOAN", "name": "车贷机构", "_count": {"funders": 0, "products": 0, "customers": 0, "departments": 1, "applications": 0}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, {"id": 1, "code": "DEMO_ORG", "name": "示例车贷机构", "_count": {"funders": 1, "products": 1, "customers": 2, "departments": 2, "applications": 2}, "status": "ACTIVE", "address": "北京市朝阳区示例路 100 号", "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": "91110000DEMO000001", "contactName": "张经理", "packageType": "STANDARD", "contactPhone": "13810000000"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:26:58.59	\N
62	\N	5	Super	file	GET	GET /saas/api/file/list?current=1&size=20 200 24ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 1, "current": 1, "records": [{"id": 2, "url": "/saas/api/uploads/images/202606/dac9b32f-6f53-4049-8af5-18d5ae268231.png", "orgId": null, "remark": null, "status": "ACTIVE", "fileExt": "png", "fileKey": "images/202606/dac9b32f-6f53-4049-8af5-18d5ae268231.png", "fileUrl": "/saas/api/uploads/images/202606/dac9b32f-6f53-4049-8af5-18d5ae268231.png", "fileName": "car-logo.png", "fileSize": 265387, "mimeType": "image/png", "tenantId": 1, "createdAt": {}, "objectKey": "images/202606/dac9b32f-6f53-4049-8af5-18d5ae268231.png", "updatedAt": {}, "businessId": null, "previewUrl": "/saas/api/uploads/images/202606/dac9b32f-6f53-4049-8af5-18d5ae268231.png", "uploadedBy": 5, "storageType": "LOCAL", "businessType": null, "categoryCode": "IMAGE", "categoryName": "图片"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:07.014	\N
78	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=1000 200 12ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "1000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:17.339	\N
80	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=1400 200 17ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "1400"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:18.843	\N
63	\N	5	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 14ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 2, "current": 1, "records": [{"id": 4, "code": "CAR_LOAN", "name": "车贷机构", "_count": {"funders": 0, "products": 0, "customers": 0, "departments": 1, "applications": 0}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, {"id": 1, "code": "DEMO_ORG", "name": "示例车贷机构", "_count": {"funders": 1, "products": 1, "customers": 2, "departments": 2, "applications": 2}, "status": "ACTIVE", "address": "北京市朝阳区示例路 100 号", "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": "91110000DEMO000001", "contactName": "张经理", "packageType": "STANDARD", "contactPhone": "13810000000"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:09.738	\N
64	\N	5	Super	application	GET	GET /saas/api/application/list?current=1&size=20 200 84ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":3,\\"tenantId\\":1,\\"orgId\\":1,\\"customerId\\":2,\\"productId\\":1,\\"funderId\\":1,\\"applicationNo\\":\\"APP202606031543330599\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[300000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"repaymentMethod\\":\\"等额本息\\",\\"purpose\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":2000,\\"currentStatus\\":10,\\"creatorId\\":5,\\"sourceLeadId\\":null,\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"remark\\":\\"移动端身份证信息提交自动创建订单草稿\\",\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"示例车贷机构\\",\\"code\\":\\"DEMO_ORG\\",\\"creditCode\\":\\"91110000DEMO000001\\",\\"contactName\\":\\"张经理\\",\\"contactPhone\\":\\"13810000000\\",\\"address\\":\\"北京市朝阳区示例路 100 号\\",\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"customer\\":{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"朱雨贵\\",\\"phone\\":\\"18538529932\\",\\"idCard\\":\\"412823199909044812\\",\\"gender\\":\\"MALE\\",\\"birthDate\\":{},\\"nation\\":\\"1\\",\\"householdAddress\\":\\"河南省遂平县阳丰乡大石桥村大石桥01-376\\",\\"issuingAuthority\\":\\"遂平县公安局\\",\\"idCardValidFrom\\":\\"2019-05-27\\",\\"idCardValidTo\\":\\"2029-05-27\\",\\"idCardFront\\":\\"images/202606/caf45c5e-3956-4c8e-b609-254d6a3d29ee.jpg\\",\\"idCardBack\\":\\"images/202606/632ff110-a769-4ba8-aa70-846be2fa6c52.jpg\\",\\"maritalStatus\\":null,\\"education\\":null,\\"occupation\\":null,\\"companyName\\":null,\\"monthlyIncome\\":null,\\"address\\":\\"河南省遂平县阳丰乡大石桥村大石桥01-376\\",\\"emergencyName\\":null,\\"emergencyPhone\\":null,\\"status\\":\\"ACTIVE\\",\\"createdAt\\":{},\\"updatedAt\\":{}},\\"product\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"标准车抵贷\\",\\"productType\\":\\"CAR_LOAN\\",\\"minRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"maxRate\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[1080000]},\\"minAmount\\":{\\"s\\":1,\\"e\\":4,\\"d\\":[50000]},\\"maxAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[500000]},\\"minTerm\\":6,\\"maxTerm\\":36,\\"repaymentMethod\\":\\"等额本息\\",\\"minAge\\":22,\\"maxAge\\":60,\\"maxCarAge\\":8,\\"maxMileage\\":150000,\\"ltvLimit\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[8000000]},\\"minDownPayment\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[2000000]},\\"regions\\":\\"北京,天津,河北\\",\\"applicableFunders\\":null,\\"accessConditions\\":null,\\"v", "truncated": true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:09.812	\N
65	\N	5	Super	application	GET	GET /saas/api/application/list?current=1&size=20 200 38ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":3,\\"tenantId\\":1,\\"orgId\\":1,\\"customerId\\":2,\\"productId\\":1,\\"funderId\\":1,\\"applicationNo\\":\\"APP202606031543330599\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[300000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"repaymentMethod\\":\\"等额本息\\",\\"purpose\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":2000,\\"currentStatus\\":10,\\"creatorId\\":5,\\"sourceLeadId\\":null,\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"remark\\":\\"移动端身份证信息提交自动创建订单草稿\\",\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"示例车贷机构\\",\\"code\\":\\"DEMO_ORG\\",\\"creditCode\\":\\"91110000DEMO000001\\",\\"contactName\\":\\"张经理\\",\\"contactPhone\\":\\"13810000000\\",\\"address\\":\\"北京市朝阳区示例路 100 号\\",\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"customer\\":{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"朱雨贵\\",\\"phone\\":\\"18538529932\\",\\"idCard\\":\\"412823199909044812\\",\\"gender\\":\\"MALE\\",\\"birthDate\\":{},\\"nation\\":\\"1\\",\\"householdAddress\\":\\"河南省遂平县阳丰乡大石桥村大石桥01-376\\",\\"issuingAuthority\\":\\"遂平县公安局\\",\\"idCardValidFrom\\":\\"2019-05-27\\",\\"idCardValidTo\\":\\"2029-05-27\\",\\"idCardFront\\":\\"images/202606/caf45c5e-3956-4c8e-b609-254d6a3d29ee.jpg\\",\\"idCardBack\\":\\"images/202606/632ff110-a769-4ba8-aa70-846be2fa6c52.jpg\\",\\"maritalStatus\\":null,\\"education\\":null,\\"occupation\\":null,\\"companyName\\":null,\\"monthlyIncome\\":null,\\"address\\":\\"河南省遂平县阳丰乡大石桥村大石桥01-376\\",\\"emergencyName\\":null,\\"emergencyPhone\\":null,\\"status\\":\\"ACTIVE\\",\\"createdAt\\":{},\\"updatedAt\\":{}},\\"product\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"标准车抵贷\\",\\"productType\\":\\"CAR_LOAN\\",\\"minRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"maxRate\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[1080000]},\\"minAmount\\":{\\"s\\":1,\\"e\\":4,\\"d\\":[50000]},\\"maxAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[500000]},\\"minTerm\\":6,\\"maxTerm\\":36,\\"repaymentMethod\\":\\"等额本息\\",\\"minAge\\":22,\\"maxAge\\":60,\\"maxCarAge\\":8,\\"maxMileage\\":150000,\\"ltvLimit\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[8000000]},\\"minDownPayment\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[2000000]},\\"regions\\":\\"北京,天津,河北\\",\\"applicableFunders\\":null,\\"accessConditions\\":null,\\"v", "truncated": true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:09.859	\N
66	\N	5	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 11ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 2, "current": 1, "records": [{"id": 4, "code": "CAR_LOAN", "name": "车贷机构", "_count": {"funders": 0, "products": 0, "customers": 0, "departments": 1, "applications": 0}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, {"id": 1, "code": "DEMO_ORG", "name": "示例车贷机构", "_count": {"funders": 1, "products": 1, "customers": 2, "departments": 2, "applications": 2}, "status": "ACTIVE", "address": "北京市朝阳区示例路 100 号", "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": "91110000DEMO000001", "contactName": "张经理", "packageType": "STANDARD", "contactPhone": "13810000000"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:11.256	\N
79	\N	5	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 14ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 2, "current": 1, "records": [{"id": 4, "code": "CAR_LOAN", "name": "车贷机构", "_count": {"funders": 0, "products": 0, "customers": 0, "departments": 1, "applications": 0}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, {"id": 1, "code": "DEMO_ORG", "name": "示例车贷机构", "_count": {"funders": 1, "products": 1, "customers": 2, "departments": 2, "applications": 2}, "status": "ACTIVE", "address": "北京市朝阳区示例路 100 号", "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": "91110000DEMO000001", "contactName": "张经理", "packageType": "STANDARD", "contactPhone": "13810000000"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:18.839	\N
67	\N	5	Super	application	GET	GET /saas/api/application/list?current=1&size=20 200 20ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":3,\\"tenantId\\":1,\\"orgId\\":1,\\"customerId\\":2,\\"productId\\":1,\\"funderId\\":1,\\"applicationNo\\":\\"APP202606031543330599\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[300000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"repaymentMethod\\":\\"等额本息\\",\\"purpose\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":2000,\\"currentStatus\\":10,\\"creatorId\\":5,\\"sourceLeadId\\":null,\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"remark\\":\\"移动端身份证信息提交自动创建订单草稿\\",\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"示例车贷机构\\",\\"code\\":\\"DEMO_ORG\\",\\"creditCode\\":\\"91110000DEMO000001\\",\\"contactName\\":\\"张经理\\",\\"contactPhone\\":\\"13810000000\\",\\"address\\":\\"北京市朝阳区示例路 100 号\\",\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"customer\\":{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"朱雨贵\\",\\"phone\\":\\"18538529932\\",\\"idCard\\":\\"412823199909044812\\",\\"gender\\":\\"MALE\\",\\"birthDate\\":{},\\"nation\\":\\"1\\",\\"householdAddress\\":\\"河南省遂平县阳丰乡大石桥村大石桥01-376\\",\\"issuingAuthority\\":\\"遂平县公安局\\",\\"idCardValidFrom\\":\\"2019-05-27\\",\\"idCardValidTo\\":\\"2029-05-27\\",\\"idCardFront\\":\\"images/202606/caf45c5e-3956-4c8e-b609-254d6a3d29ee.jpg\\",\\"idCardBack\\":\\"images/202606/632ff110-a769-4ba8-aa70-846be2fa6c52.jpg\\",\\"maritalStatus\\":null,\\"education\\":null,\\"occupation\\":null,\\"companyName\\":null,\\"monthlyIncome\\":null,\\"address\\":\\"河南省遂平县阳丰乡大石桥村大石桥01-376\\",\\"emergencyName\\":null,\\"emergencyPhone\\":null,\\"status\\":\\"ACTIVE\\",\\"createdAt\\":{},\\"updatedAt\\":{}},\\"product\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"标准车抵贷\\",\\"productType\\":\\"CAR_LOAN\\",\\"minRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"maxRate\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[1080000]},\\"minAmount\\":{\\"s\\":1,\\"e\\":4,\\"d\\":[50000]},\\"maxAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[500000]},\\"minTerm\\":6,\\"maxTerm\\":36,\\"repaymentMethod\\":\\"等额本息\\",\\"minAge\\":22,\\"maxAge\\":60,\\"maxCarAge\\":8,\\"maxMileage\\":150000,\\"ltvLimit\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[8000000]},\\"minDownPayment\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[2000000]},\\"regions\\":\\"北京,天津,河北\\",\\"applicableFunders\\":null,\\"accessConditions\\":null,\\"v", "truncated": true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:11.271	\N
68	\N	5	Super	application	GET	GET /saas/api/application/list?current=1&size=20 200 21ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":3,\\"tenantId\\":1,\\"orgId\\":1,\\"customerId\\":2,\\"productId\\":1,\\"funderId\\":1,\\"applicationNo\\":\\"APP202606031543330599\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[300000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"repaymentMethod\\":\\"等额本息\\",\\"purpose\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":2000,\\"currentStatus\\":10,\\"creatorId\\":5,\\"sourceLeadId\\":null,\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"remark\\":\\"移动端身份证信息提交自动创建订单草稿\\",\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"示例车贷机构\\",\\"code\\":\\"DEMO_ORG\\",\\"creditCode\\":\\"91110000DEMO000001\\",\\"contactName\\":\\"张经理\\",\\"contactPhone\\":\\"13810000000\\",\\"address\\":\\"北京市朝阳区示例路 100 号\\",\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"customer\\":{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"朱雨贵\\",\\"phone\\":\\"18538529932\\",\\"idCard\\":\\"412823199909044812\\",\\"gender\\":\\"MALE\\",\\"birthDate\\":{},\\"nation\\":\\"1\\",\\"householdAddress\\":\\"河南省遂平县阳丰乡大石桥村大石桥01-376\\",\\"issuingAuthority\\":\\"遂平县公安局\\",\\"idCardValidFrom\\":\\"2019-05-27\\",\\"idCardValidTo\\":\\"2029-05-27\\",\\"idCardFront\\":\\"images/202606/caf45c5e-3956-4c8e-b609-254d6a3d29ee.jpg\\",\\"idCardBack\\":\\"images/202606/632ff110-a769-4ba8-aa70-846be2fa6c52.jpg\\",\\"maritalStatus\\":null,\\"education\\":null,\\"occupation\\":null,\\"companyName\\":null,\\"monthlyIncome\\":null,\\"address\\":\\"河南省遂平县阳丰乡大石桥村大石桥01-376\\",\\"emergencyName\\":null,\\"emergencyPhone\\":null,\\"status\\":\\"ACTIVE\\",\\"createdAt\\":{},\\"updatedAt\\":{}},\\"product\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"标准车抵贷\\",\\"productType\\":\\"CAR_LOAN\\",\\"minRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"maxRate\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[1080000]},\\"minAmount\\":{\\"s\\":1,\\"e\\":4,\\"d\\":[50000]},\\"maxAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[500000]},\\"minTerm\\":6,\\"maxTerm\\":36,\\"repaymentMethod\\":\\"等额本息\\",\\"minAge\\":22,\\"maxAge\\":60,\\"maxCarAge\\":8,\\"maxMileage\\":150000,\\"ltvLimit\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[8000000]},\\"minDownPayment\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[2000000]},\\"regions\\":\\"北京,天津,河北\\",\\"applicableFunders\\":null,\\"accessConditions\\":null,\\"v", "truncated": true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:11.301	\N
69	\N	5	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 19ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 2, "current": 1, "records": [{"id": 4, "code": "CAR_LOAN", "name": "车贷机构", "_count": {"funders": 0, "products": 0, "customers": 0, "departments": 1, "applications": 0}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, {"id": 1, "code": "DEMO_ORG", "name": "示例车贷机构", "_count": {"funders": 1, "products": 1, "customers": 2, "departments": 2, "applications": 2}, "status": "ACTIVE", "address": "北京市朝阳区示例路 100 号", "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": "91110000DEMO000001", "contactName": "张经理", "packageType": "STANDARD", "contactPhone": "13810000000"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:12.42	\N
83	\N	5	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 14ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 2, "current": 1, "records": [{"id": 4, "code": "CAR_LOAN", "name": "车贷机构", "_count": {"funders": 0, "products": 0, "customers": 0, "departments": 1, "applications": 0}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, {"id": 1, "code": "DEMO_ORG", "name": "示例车贷机构", "_count": {"funders": 1, "products": 1, "customers": 2, "departments": 2, "applications": 2}, "status": "ACTIVE", "address": "北京市朝阳区示例路 100 号", "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": "91110000DEMO000001", "contactName": "张经理", "packageType": "STANDARD", "contactPhone": "13810000000"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:24.176	\N
84	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=1000 200 12ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "1000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:24.2	\N
86	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=1400 200 18ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "1400"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:26.166	\N
88	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=1400 200 9ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "1400"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:26.183	\N
70	\N	5	Super	application	GET	GET /saas/api/application/list?current=1&size=20 200 28ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":3,\\"tenantId\\":1,\\"orgId\\":1,\\"customerId\\":2,\\"productId\\":1,\\"funderId\\":1,\\"applicationNo\\":\\"APP202606031543330599\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[300000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"repaymentMethod\\":\\"等额本息\\",\\"purpose\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":2000,\\"currentStatus\\":10,\\"creatorId\\":5,\\"sourceLeadId\\":null,\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"remark\\":\\"移动端身份证信息提交自动创建订单草稿\\",\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"示例车贷机构\\",\\"code\\":\\"DEMO_ORG\\",\\"creditCode\\":\\"91110000DEMO000001\\",\\"contactName\\":\\"张经理\\",\\"contactPhone\\":\\"13810000000\\",\\"address\\":\\"北京市朝阳区示例路 100 号\\",\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"customer\\":{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"朱雨贵\\",\\"phone\\":\\"18538529932\\",\\"idCard\\":\\"412823199909044812\\",\\"gender\\":\\"MALE\\",\\"birthDate\\":{},\\"nation\\":\\"1\\",\\"householdAddress\\":\\"河南省遂平县阳丰乡大石桥村大石桥01-376\\",\\"issuingAuthority\\":\\"遂平县公安局\\",\\"idCardValidFrom\\":\\"2019-05-27\\",\\"idCardValidTo\\":\\"2029-05-27\\",\\"idCardFront\\":\\"images/202606/caf45c5e-3956-4c8e-b609-254d6a3d29ee.jpg\\",\\"idCardBack\\":\\"images/202606/632ff110-a769-4ba8-aa70-846be2fa6c52.jpg\\",\\"maritalStatus\\":null,\\"education\\":null,\\"occupation\\":null,\\"companyName\\":null,\\"monthlyIncome\\":null,\\"address\\":\\"河南省遂平县阳丰乡大石桥村大石桥01-376\\",\\"emergencyName\\":null,\\"emergencyPhone\\":null,\\"status\\":\\"ACTIVE\\",\\"createdAt\\":{},\\"updatedAt\\":{}},\\"product\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"标准车抵贷\\",\\"productType\\":\\"CAR_LOAN\\",\\"minRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"maxRate\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[1080000]},\\"minAmount\\":{\\"s\\":1,\\"e\\":4,\\"d\\":[50000]},\\"maxAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[500000]},\\"minTerm\\":6,\\"maxTerm\\":36,\\"repaymentMethod\\":\\"等额本息\\",\\"minAge\\":22,\\"maxAge\\":60,\\"maxCarAge\\":8,\\"maxMileage\\":150000,\\"ltvLimit\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[8000000]},\\"minDownPayment\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[2000000]},\\"regions\\":\\"北京,天津,河北\\",\\"applicableFunders\\":null,\\"accessConditions\\":null,\\"v", "truncated": true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:12.434	\N
71	\N	5	Super	application	GET	GET /saas/api/application/list?current=1&size=20 200 20ms	{"body": {}, "query": {"size": "20", "current": "1"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":3,\\"tenantId\\":1,\\"orgId\\":1,\\"customerId\\":2,\\"productId\\":1,\\"funderId\\":1,\\"applicationNo\\":\\"APP202606031543330599\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[300000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"repaymentMethod\\":\\"等额本息\\",\\"purpose\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":2000,\\"currentStatus\\":10,\\"creatorId\\":5,\\"sourceLeadId\\":null,\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"remark\\":\\"移动端身份证信息提交自动创建订单草稿\\",\\"createdAt\\":{},\\"updatedAt\\":{},\\"org\\":{\\"id\\":1,\\"tenantId\\":1,\\"name\\":\\"示例车贷机构\\",\\"code\\":\\"DEMO_ORG\\",\\"creditCode\\":\\"91110000DEMO000001\\",\\"contactName\\":\\"张经理\\",\\"contactPhone\\":\\"13810000000\\",\\"address\\":\\"北京市朝阳区示例路 100 号\\",\\"status\\":\\"ACTIVE\\",\\"packageType\\":\\"STANDARD\\",\\"expireAt\\":null,\\"apiEnabled\\":true,\\"createdAt\\":{},\\"updatedAt\\":{}},\\"customer\\":{\\"id\\":2,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"朱雨贵\\",\\"phone\\":\\"18538529932\\",\\"idCard\\":\\"412823199909044812\\",\\"gender\\":\\"MALE\\",\\"birthDate\\":{},\\"nation\\":\\"1\\",\\"householdAddress\\":\\"河南省遂平县阳丰乡大石桥村大石桥01-376\\",\\"issuingAuthority\\":\\"遂平县公安局\\",\\"idCardValidFrom\\":\\"2019-05-27\\",\\"idCardValidTo\\":\\"2029-05-27\\",\\"idCardFront\\":\\"images/202606/caf45c5e-3956-4c8e-b609-254d6a3d29ee.jpg\\",\\"idCardBack\\":\\"images/202606/632ff110-a769-4ba8-aa70-846be2fa6c52.jpg\\",\\"maritalStatus\\":null,\\"education\\":null,\\"occupation\\":null,\\"companyName\\":null,\\"monthlyIncome\\":null,\\"address\\":\\"河南省遂平县阳丰乡大石桥村大石桥01-376\\",\\"emergencyName\\":null,\\"emergencyPhone\\":null,\\"status\\":\\"ACTIVE\\",\\"createdAt\\":{},\\"updatedAt\\":{}},\\"product\\":{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"name\\":\\"标准车抵贷\\",\\"productType\\":\\"CAR_LOAN\\",\\"minRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"maxRate\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[1080000]},\\"minAmount\\":{\\"s\\":1,\\"e\\":4,\\"d\\":[50000]},\\"maxAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[500000]},\\"minTerm\\":6,\\"maxTerm\\":36,\\"repaymentMethod\\":\\"等额本息\\",\\"minAge\\":22,\\"maxAge\\":60,\\"maxCarAge\\":8,\\"maxMileage\\":150000,\\"ltvLimit\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[8000000]},\\"minDownPayment\\":{\\"s\\":1,\\"e\\":-1,\\"d\\":[2000000]},\\"regions\\":\\"北京,天津,河北\\",\\"applicableFunders\\":null,\\"accessConditions\\":null,\\"v", "truncated": true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:12.464	\N
72	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=1000 200 16ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "1000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:15.06	\N
73	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=1000 200 10ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "1000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:15.078	\N
74	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=1000 200 13ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "1000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:15.098	\N
75	\N	5	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 17ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 2, "current": 1, "records": [{"id": 4, "code": "CAR_LOAN", "name": "车贷机构", "_count": {"funders": 0, "products": 0, "customers": 0, "departments": 1, "applications": 0}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, {"id": 1, "code": "DEMO_ORG", "name": "示例车贷机构", "_count": {"funders": 1, "products": 1, "customers": 2, "departments": 2, "applications": 2}, "status": "ACTIVE", "address": "北京市朝阳区示例路 100 号", "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": "91110000DEMO000001", "contactName": "张经理", "packageType": "STANDARD", "contactPhone": "13810000000"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:15.345	\N
76	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=1000 200 20ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "1000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:15.349	\N
77	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=1000 200 10ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "1000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:15.368	\N
81	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=1400 200 16ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "1400"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:18.869	\N
82	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=1000 200 13ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "1000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:22.959	\N
85	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=1000 200 13ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "1000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:24.178	\N
87	\N	5	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 33ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 2, "current": 1, "records": [{"id": 4, "code": "CAR_LOAN", "name": "车贷机构", "_count": {"funders": 0, "products": 0, "customers": 0, "departments": 1, "applications": 0}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, {"id": 1, "code": "DEMO_ORG", "name": "示例车贷机构", "_count": {"funders": 1, "products": 1, "customers": 2, "departments": 2, "applications": 2}, "status": "ACTIVE", "address": "北京市朝阳区示例路 100 号", "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": "91110000DEMO000001", "contactName": "张经理", "packageType": "STANDARD", "contactPhone": "13810000000"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:26.177	\N
90	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=2000 200 17ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "2000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:27.376	\N
91	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=2000 200 12ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "2000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:27.398	\N
92	\N	5	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 12ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 2, "current": 1, "records": [{"id": 4, "code": "CAR_LOAN", "name": "车贷机构", "_count": {"funders": 0, "products": 0, "customers": 0, "departments": 1, "applications": 0}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, {"id": 1, "code": "DEMO_ORG", "name": "示例车贷机构", "_count": {"funders": 1, "products": 1, "customers": 2, "departments": 2, "applications": 2}, "status": "ACTIVE", "address": "北京市朝阳区示例路 100 号", "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": "91110000DEMO000001", "contactName": "张经理", "packageType": "STANDARD", "contactPhone": "13810000000"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:28.471	\N
93	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=3000 200 12ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "3000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:28.5	\N
94	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=3000 200 11ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "3000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:28.519	\N
126	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=5000 200 11ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "5000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 05:46:15.972	\N
127	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=5000 200 8ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "5000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 05:46:15.987	\N
89	\N	5	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 16ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 2, "current": 1, "records": [{"id": 4, "code": "CAR_LOAN", "name": "车贷机构", "_count": {"funders": 0, "products": 0, "customers": 0, "departments": 1, "applications": 0}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, {"id": 1, "code": "DEMO_ORG", "name": "示例车贷机构", "_count": {"funders": 1, "products": 1, "customers": 2, "departments": 2, "applications": 2}, "status": "ACTIVE", "address": "北京市朝阳区示例路 100 号", "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": "91110000DEMO000001", "contactName": "张经理", "packageType": "STANDARD", "contactPhone": "13810000000"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:27.372	\N
96	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=5000 200 12ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "5000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:29.399	\N
97	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=5000 200 12ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "5000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:29.42	\N
98	\N	5	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 13ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 2, "current": 1, "records": [{"id": 4, "code": "CAR_LOAN", "name": "车贷机构", "_count": {"funders": 0, "products": 0, "customers": 0, "departments": 1, "applications": 0}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, {"id": 1, "code": "DEMO_ORG", "name": "示例车贷机构", "_count": {"funders": 1, "products": 1, "customers": 2, "departments": 2, "applications": 2}, "status": "ACTIVE", "address": "北京市朝阳区示例路 100 号", "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": "91110000DEMO000001", "contactName": "张经理", "packageType": "STANDARD", "contactPhone": "13810000000"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:30.35	\N
95	\N	5	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 11ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 2, "current": 1, "records": [{"id": 4, "code": "CAR_LOAN", "name": "车贷机构", "_count": {"funders": 0, "products": 0, "customers": 0, "departments": 1, "applications": 0}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, {"id": 1, "code": "DEMO_ORG", "name": "示例车贷机构", "_count": {"funders": 1, "products": 1, "customers": 2, "departments": 2, "applications": 2}, "status": "ACTIVE", "address": "北京市朝阳区示例路 100 号", "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": "91110000DEMO000001", "contactName": "张经理", "packageType": "STANDARD", "contactPhone": "13810000000"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:29.395	\N
99	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=4000 200 11ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "4000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:30.356	\N
100	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=4000 200 10ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "4000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:30.374	\N
101	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=1000 200 15ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "1000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 03:27:30.923	\N
102	\N	5	Super	application	GET	GET /saas/api/application/order-list?pageNum=1&pageSize=10 200 46ms	{"body": {}, "query": {"pageNum": "1", "pageSize": "10"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":3,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":2,\\"uuid\\":\\"2\\",\\"customerName\\":\\"朱雨贵\\",\\"personName\\":\\"朱雨贵\\",\\"name\\":\\"朱雨贵\\",\\"phone\\":\\"18538529932\\",\\"telephone\\":\\"18538529932\\",\\"idCard\\":\\"412823199909044812\\",\\"vehicleId\\":2,\\"plateNumber\\":\\"苏UJ725L\\",\\"vehicleBrand\\":\\"小型轿车\\",\\"vehicleModel\\":\\"宝马牌BMWT200QL（BMW320L\\",\\"vehicleOwner\\":\\"陈发剑\\",\\"applicationNo\\":\\"APP202606031543330599\\",\\"orderNo\\":\\"APP202606031543330599\\",\\"creditOrderId\\":\\"APP202606031543330599\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[300000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":2000,\\"nodeCode\\":2000,\\"currentNodeName\\":\\"风控模型预审\\",\\"nodeName\\":\\"风控模型预审\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":2000,\\"phaseName\\":\\"风控模型预审\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderName\\":\\"示例银行资金方\\",\\"creatorId\\":5,\\"creatorName\\":\\"Super Admin\\",\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"remark\\":\\"移动端身份证信息提交自动创建订单草稿\\",\\"createdAt\\":{},\\"updatedAt\\":{}},{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":1,\\"uuid\\":\\"1\\",\\"customerName\\":\\"王小明\\",\\"personName\\":\\"王小明\\",\\"name\\":\\"王小明\\",\\"phone\\":\\"13910000001\\",\\"telephone\\":\\"13910000001\\",\\"idCard\\":\\"110101199001010011\\",\\"vehicleId\\":1,\\"plateNumber\\":\\"京A12345\\",\\"vehicleBrand\\":\\"大众\\",\\"vehicleModel\\":\\"迈腾\\",\\"vehicleOwner\\":\\"\\",\\"applicationNo\\":\\"APP-DEMO-0001\\",\\"orderNo\\":\\"APP-DEMO-0001\\",\\"creditOrderId\\":\\"APP-DEMO-0001\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[120000]},\\"term\\":24,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[680000]},\\"approvedAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[115000]},\\"approvedTerm\\":24,\\"approvedRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[660000]},\\"status\\":\\"PENDING_DISBURSEMENT\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":7000,\\"nodeCode\\":7000,\\"currentNodeName\\":\\"请款资料\\",\\"nodeName\\":\\"请款资料\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":7000,\\"phaseName\\":\\"请款资料\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderNam", "truncated": true}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 03:32:16.338	\N
103	\N	5	Super	application	GET	GET /saas/api/application/order-list?pageNum=1&pageSize=10 200 66ms	{"body": {}, "query": {"pageNum": "1", "pageSize": "10"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":3,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":2,\\"uuid\\":\\"2\\",\\"customerName\\":\\"朱雨贵\\",\\"personName\\":\\"朱雨贵\\",\\"name\\":\\"朱雨贵\\",\\"phone\\":\\"18538529932\\",\\"telephone\\":\\"18538529932\\",\\"idCard\\":\\"412823199909044812\\",\\"vehicleId\\":2,\\"plateNumber\\":\\"苏UJ725L\\",\\"vehicleBrand\\":\\"小型轿车\\",\\"vehicleModel\\":\\"宝马牌BMWT200QL（BMW320L\\",\\"vehicleOwner\\":\\"陈发剑\\",\\"applicationNo\\":\\"APP202606031543330599\\",\\"orderNo\\":\\"APP202606031543330599\\",\\"creditOrderId\\":\\"APP202606031543330599\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[300000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":2000,\\"nodeCode\\":2000,\\"currentNodeName\\":\\"风控模型预审\\",\\"nodeName\\":\\"风控模型预审\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":2000,\\"phaseName\\":\\"风控模型预审\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderName\\":\\"示例银行资金方\\",\\"creatorId\\":5,\\"creatorName\\":\\"Super Admin\\",\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"remark\\":\\"移动端身份证信息提交自动创建订单草稿\\",\\"createdAt\\":{},\\"updatedAt\\":{}},{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":1,\\"uuid\\":\\"1\\",\\"customerName\\":\\"王小明\\",\\"personName\\":\\"王小明\\",\\"name\\":\\"王小明\\",\\"phone\\":\\"13910000001\\",\\"telephone\\":\\"13910000001\\",\\"idCard\\":\\"110101199001010011\\",\\"vehicleId\\":1,\\"plateNumber\\":\\"京A12345\\",\\"vehicleBrand\\":\\"大众\\",\\"vehicleModel\\":\\"迈腾\\",\\"vehicleOwner\\":\\"\\",\\"applicationNo\\":\\"APP-DEMO-0001\\",\\"orderNo\\":\\"APP-DEMO-0001\\",\\"creditOrderId\\":\\"APP-DEMO-0001\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[120000]},\\"term\\":24,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[680000]},\\"approvedAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[115000]},\\"approvedTerm\\":24,\\"approvedRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[660000]},\\"status\\":\\"PENDING_DISBURSEMENT\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":7000,\\"nodeCode\\":7000,\\"currentNodeName\\":\\"请款资料\\",\\"nodeName\\":\\"请款资料\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":7000,\\"phaseName\\":\\"请款资料\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderNam", "truncated": true}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 04:01:54.236	\N
104	\N	5	Super	application	GET	GET /saas/api/application/order-list?pageNum=1&pageSize=10 200 63ms	{"body": {}, "query": {"pageNum": "1", "pageSize": "10"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":3,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":2,\\"uuid\\":\\"2\\",\\"customerName\\":\\"朱雨贵\\",\\"personName\\":\\"朱雨贵\\",\\"name\\":\\"朱雨贵\\",\\"phone\\":\\"18538529932\\",\\"telephone\\":\\"18538529932\\",\\"idCard\\":\\"412823199909044812\\",\\"vehicleId\\":2,\\"plateNumber\\":\\"苏UJ725L\\",\\"vehicleBrand\\":\\"小型轿车\\",\\"vehicleModel\\":\\"宝马牌BMWT200QL（BMW320L\\",\\"vehicleOwner\\":\\"陈发剑\\",\\"applicationNo\\":\\"APP202606031543330599\\",\\"orderNo\\":\\"APP202606031543330599\\",\\"creditOrderId\\":\\"APP202606031543330599\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[300000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":2000,\\"nodeCode\\":2000,\\"currentNodeName\\":\\"风控模型预审\\",\\"nodeName\\":\\"风控模型预审\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":2000,\\"phaseName\\":\\"风控模型预审\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderName\\":\\"示例银行资金方\\",\\"creatorId\\":5,\\"creatorName\\":\\"Super Admin\\",\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"remark\\":\\"移动端身份证信息提交自动创建订单草稿\\",\\"createdAt\\":{},\\"updatedAt\\":{}},{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":1,\\"uuid\\":\\"1\\",\\"customerName\\":\\"王小明\\",\\"personName\\":\\"王小明\\",\\"name\\":\\"王小明\\",\\"phone\\":\\"13910000001\\",\\"telephone\\":\\"13910000001\\",\\"idCard\\":\\"110101199001010011\\",\\"vehicleId\\":1,\\"plateNumber\\":\\"京A12345\\",\\"vehicleBrand\\":\\"大众\\",\\"vehicleModel\\":\\"迈腾\\",\\"vehicleOwner\\":\\"\\",\\"applicationNo\\":\\"APP-DEMO-0001\\",\\"orderNo\\":\\"APP-DEMO-0001\\",\\"creditOrderId\\":\\"APP-DEMO-0001\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[120000]},\\"term\\":24,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[680000]},\\"approvedAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[115000]},\\"approvedTerm\\":24,\\"approvedRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[660000]},\\"status\\":\\"PENDING_DISBURSEMENT\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":7000,\\"nodeCode\\":7000,\\"currentNodeName\\":\\"请款资料\\",\\"nodeName\\":\\"请款资料\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":7000,\\"phaseName\\":\\"请款资料\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderNam", "truncated": true}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 04:33:57.862	\N
105	\N	5	Super	application	GET	GET /saas/api/application/order-list?pageNum=1&pageSize=10 200 26ms	{"body": {}, "query": {"pageNum": "1", "pageSize": "10"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":3,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":2,\\"uuid\\":\\"2\\",\\"customerName\\":\\"朱雨贵\\",\\"personName\\":\\"朱雨贵\\",\\"name\\":\\"朱雨贵\\",\\"phone\\":\\"18538529932\\",\\"telephone\\":\\"18538529932\\",\\"idCard\\":\\"412823199909044812\\",\\"vehicleId\\":2,\\"plateNumber\\":\\"苏UJ725L\\",\\"vehicleBrand\\":\\"小型轿车\\",\\"vehicleModel\\":\\"宝马牌BMWT200QL（BMW320L\\",\\"vehicleOwner\\":\\"陈发剑\\",\\"applicationNo\\":\\"APP202606031543330599\\",\\"orderNo\\":\\"APP202606031543330599\\",\\"creditOrderId\\":\\"APP202606031543330599\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[300000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":2000,\\"nodeCode\\":2000,\\"currentNodeName\\":\\"风控模型预审\\",\\"nodeName\\":\\"风控模型预审\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":2000,\\"phaseName\\":\\"风控模型预审\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderName\\":\\"示例银行资金方\\",\\"creatorId\\":5,\\"creatorName\\":\\"Super Admin\\",\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"remark\\":\\"移动端身份证信息提交自动创建订单草稿\\",\\"createdAt\\":{},\\"updatedAt\\":{}},{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":1,\\"uuid\\":\\"1\\",\\"customerName\\":\\"王小明\\",\\"personName\\":\\"王小明\\",\\"name\\":\\"王小明\\",\\"phone\\":\\"13910000001\\",\\"telephone\\":\\"13910000001\\",\\"idCard\\":\\"110101199001010011\\",\\"vehicleId\\":1,\\"plateNumber\\":\\"京A12345\\",\\"vehicleBrand\\":\\"大众\\",\\"vehicleModel\\":\\"迈腾\\",\\"vehicleOwner\\":\\"\\",\\"applicationNo\\":\\"APP-DEMO-0001\\",\\"orderNo\\":\\"APP-DEMO-0001\\",\\"creditOrderId\\":\\"APP-DEMO-0001\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[120000]},\\"term\\":24,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[680000]},\\"approvedAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[115000]},\\"approvedTerm\\":24,\\"approvedRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[660000]},\\"status\\":\\"PENDING_DISBURSEMENT\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":7000,\\"nodeCode\\":7000,\\"currentNodeName\\":\\"请款资料\\",\\"nodeName\\":\\"请款资料\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":7000,\\"phaseName\\":\\"请款资料\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderNam", "truncated": true}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 04:34:13.793	\N
106	\N	5	Super	m	GET	GET /saas/api/m/statistics/overview 200 0ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 04:34:54.774	\N
107	\N	5	Super	m	GET	GET /saas/api/m/statistics/overview 200 0ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 04:34:55.816	\N
108	\N	5	Super	m	GET	GET /saas/api/m/credit/getCreditDetailByOrderId/APP202606031543330599 200 21ms	{"body": {}, "query": {}, "params": {"creditOrderId": "APP202606031543330599"}}	{"msg": "success", "code": 200, "data": {"id": 3, "name": "朱雨贵", "uuid": "2", "phone": "18538529932", "remark": "移动端身份证信息提交自动创建订单草稿", "status": 4, "periods": 12, "vehicle": {"id": 2, "uuid": "2", "address": "江苏省苏州市吴中区珠江小区123号楼605室", "mileage": 9000, "sealInfo": "市公安局交通警察支队", "isMortgage": 2, "plateNumber": "苏UJ725L", "usageNature": "非营运", "vehicleCode": "LBV8W3106HMH43140", "engineNumber": "37D168", "registerDate": "2017-07-14", "vehicleBrand": "小型轿车", "vehicleColor": null, "vehicleModel": "宝马牌BMWT200QL（BMW320L", "vehicleOwner": "陈发剑", "vehicleImgUrl": "/saas/api/uploads/images/202606/642c260e-cb5e-48c3-90b1-17511afe86c0.jpg"}, "customer": {"id": 2, "race": "1", "uuid": "2", "gender": 1, "nation": "1", "telephone": "18538529932", "idcardBack": "/saas/api/uploads/images/202606/632ff110-a769-4ba8-aa70-846be2fa6c52.jpg", "personName": "朱雨贵", "updateTime": "2026-06-03 17:46:05", "idcardFront": "/saas/api/uploads/images/202606/caf45c5e-3956-4c8e-b609-254d6a3d29ee.jpg", "personIdcard": "412823199909044812", "personAddress": "河南省遂平县阳丰乡大石桥村大石桥01-376", "personValidDateEnd": "2029-05-27", "personValidDateStart": "2019-05-27", "personIssuingAuthority": "遂平县公安局"}, "pushQuota": "300000.00", "createTime": "2026-06-03 15:43:33", "updateTime": "2026-06-03 17:47:24", "productName": "标准车抵贷", "businessNode": "PRE_AUDIT", "creditOrderId": "APP202606031543330599"}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 04:34:58.746	\N
109	\N	\N	\N	auth	POST	POST /saas/api/auth/login 200 136ms	{"body": {"password": "***", "userName": "Super"}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"token": "***", "refreshToken": "***"}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 05:41:41.934	\N
110	\N	5	Super	user	GET	GET /saas/api/user/info 200 14ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"email": "super@example.com", "roles": ["R_SUPER"], "avatar": null, "userId": 5, "buttons": [], "userName": "Super"}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 05:41:41.958	\N
111	\N	5	Super	m	GET	GET /saas/api/m/statistics/overview 200 0ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 05:41:42.544	\N
112	\N	5	Super	application	GET	GET /saas/api/application/order-list?pageNum=1&pageSize=10 200 61ms	{"body": {}, "query": {"pageNum": "1", "pageSize": "10"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":3,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":2,\\"uuid\\":\\"2\\",\\"customerName\\":\\"朱雨贵\\",\\"personName\\":\\"朱雨贵\\",\\"name\\":\\"朱雨贵\\",\\"phone\\":\\"18538529932\\",\\"telephone\\":\\"18538529932\\",\\"idCard\\":\\"412823199909044812\\",\\"vehicleId\\":2,\\"plateNumber\\":\\"苏UJ725L\\",\\"vehicleBrand\\":\\"小型轿车\\",\\"vehicleModel\\":\\"宝马牌BMWT200QL（BMW320L\\",\\"vehicleOwner\\":\\"陈发剑\\",\\"applicationNo\\":\\"APP202606031543330599\\",\\"orderNo\\":\\"APP202606031543330599\\",\\"creditOrderId\\":\\"APP202606031543330599\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[300000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":2000,\\"nodeCode\\":2000,\\"currentNodeName\\":\\"风控模型预审\\",\\"nodeName\\":\\"风控模型预审\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":2000,\\"phaseName\\":\\"风控模型预审\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderName\\":\\"示例银行资金方\\",\\"creatorId\\":5,\\"creatorName\\":\\"Super Admin\\",\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"remark\\":\\"移动端身份证信息提交自动创建订单草稿\\",\\"createdAt\\":{},\\"updatedAt\\":{}},{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":1,\\"uuid\\":\\"1\\",\\"customerName\\":\\"王小明\\",\\"personName\\":\\"王小明\\",\\"name\\":\\"王小明\\",\\"phone\\":\\"13910000001\\",\\"telephone\\":\\"13910000001\\",\\"idCard\\":\\"110101199001010011\\",\\"vehicleId\\":1,\\"plateNumber\\":\\"京A12345\\",\\"vehicleBrand\\":\\"大众\\",\\"vehicleModel\\":\\"迈腾\\",\\"vehicleOwner\\":\\"\\",\\"applicationNo\\":\\"APP-DEMO-0001\\",\\"orderNo\\":\\"APP-DEMO-0001\\",\\"creditOrderId\\":\\"APP-DEMO-0001\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[120000]},\\"term\\":24,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[680000]},\\"approvedAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[115000]},\\"approvedTerm\\":24,\\"approvedRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[660000]},\\"status\\":\\"PENDING_DISBURSEMENT\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":7000,\\"nodeCode\\":7000,\\"currentNodeName\\":\\"请款资料\\",\\"nodeName\\":\\"请款资料\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":7000,\\"phaseName\\":\\"请款资料\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderNam", "truncated": true}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 05:41:43.781	\N
113	\N	\N	\N	auth	POST	POST /saas/api/auth/login 200 74ms	{"body": {"password": "***", "userName": "Super"}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"token": "***", "refreshToken": "***"}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 05:46:09.857	\N
114	\N	5	Super	user	GET	GET /saas/api/user/info 200 9ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"email": "super@example.com", "roles": ["R_SUPER"], "avatar": null, "userId": 5, "buttons": [], "userName": "Super"}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 05:46:09.882	\N
115	\N	5	Super	v3	GET	GET /saas/api/v3/system/menus 200 38ms	{"body": {}, "query": {}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":[{\\"id\\":1,\\"parentId\\":null,\\"path\\":\\"/dashboard\\",\\"name\\":\\"Dashboard\\",\\"component\\":\\"/index/index\\",\\"meta\\":{\\"title\\":\\"仪表盘\\",\\"icon\\":\\"ri:dashboard-line\\",\\"sort\\":10,\\"keepAlive\\":false,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]},\\"children\\":[{\\"id\\":2,\\"parentId\\":1,\\"path\\":\\"console\\",\\"name\\":\\"Console\\",\\"component\\":\\"/dashboard/console\\",\\"meta\\":{\\"title\\":\\"工作台\\",\\"icon\\":\\"ri:computer-line\\",\\"sort\\":11,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]}},{\\"id\\":3,\\"parentId\\":1,\\"path\\":\\"analysis\\",\\"name\\":\\"Analysis\\",\\"component\\":\\"/dashboard/analysis\\",\\"meta\\":{\\"title\\":\\"分析页\\",\\"icon\\":\\"ri:line-chart-line\\",\\"sort\\":12,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\",\\"R_ADMIN\\",\\"R_SALES_MANAGER\\",\\"R_SALES\\",\\"R_APPROVER\\",\\"R_FINANCE\\",\\"R_CS_COLLECTION\\",\\"R_USER\\"],\\"authList\\":[]}}]},{\\"id\\":24,\\"parentId\\":null,\\"path\\":\\"/platform\\",\\"name\\":\\"Platform\\",\\"component\\":\\"/index/index\\",\\"meta\\":{\\"title\\":\\"平台管理\\",\\"icon\\":\\"ri:global-line\\",\\"sort\\":20,\\"keepAlive\\":false,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SALES_MANAGER\\",\\"R_ADMIN\\",\\"R_SUPER\\",\\"R_OPERATION\\"],\\"authList\\":[]},\\"children\\":[{\\"id\\":25,\\"parentId\\":24,\\"path\\":\\"tenant\\",\\"name\\":\\"TenantMgmt\\",\\"component\\":\\"/business/common-list\\",\\"meta\\":{\\"title\\":\\"租户机构管理\\",\\"icon\\":\\"ri:building-2-line\\",\\"sort\\":21,\\"keepAlive\\":true,\\"isHide\\":false,\\"isHideTab\\":false,\\"link\\":null,\\"isIframe\\":false,\\"roles\\":[\\"R_SUPER\\",\\"R_OPERATION\\"],\\"authList\\":[{\\"id\\":37,\\"title\\":\\"Add\\",\\"authMark\\":\\"add\\",\\"roles\\":[]},{\\"id\\":38,\\"title\\":\\"Edit\\",\\"authMark\\":\\"edit\\",\\"roles\\":[]},{\\"id\\":39,\\"title\\":\\"Delete\\",\\"authMark\\":\\"delete\\",\\"roles\\":[]}]}},{\\"id\\":26,\\"parentId\\":24,\\"path\\":\\"package-billing\\",\\"name\\":\\"PackageBilling\\",\\"component", "truncated": true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 05:46:09.945	\N
116	\N	5	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 54ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 2, "current": 1, "records": [{"id": 4, "code": "CAR_LOAN", "name": "车贷机构", "_count": {"funders": 0, "products": 0, "customers": 0, "departments": 1, "applications": 0}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, {"id": 1, "code": "DEMO_ORG", "name": "示例车贷机构", "_count": {"funders": 1, "products": 1, "customers": 2, "departments": 2, "applications": 2}, "status": "ACTIVE", "address": "北京市朝阳区示例路 100 号", "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": "91110000DEMO000001", "contactName": "张经理", "packageType": "STANDARD", "contactPhone": "13810000000"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 05:46:10.188	\N
117	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=1400 200 67ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "1400"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 05:46:10.204	\N
118	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=1400 200 13ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "1400"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 05:46:10.225	\N
119	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=2000 200 10ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "2000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 05:46:14.238	\N
120	\N	5	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 26ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 2, "current": 1, "records": [{"id": 4, "code": "CAR_LOAN", "name": "车贷机构", "_count": {"funders": 0, "products": 0, "customers": 0, "departments": 1, "applications": 0}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, {"id": 1, "code": "DEMO_ORG", "name": "示例车贷机构", "_count": {"funders": 1, "products": 1, "customers": 2, "departments": 2, "applications": 2}, "status": "ACTIVE", "address": "北京市朝阳区示例路 100 号", "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": "91110000DEMO000001", "contactName": "张经理", "packageType": "STANDARD", "contactPhone": "13810000000"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 05:46:14.253	\N
121	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=2000 200 11ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "2000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 05:46:14.256	\N
122	\N	5	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 11ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 2, "current": 1, "records": [{"id": 4, "code": "CAR_LOAN", "name": "车贷机构", "_count": {"funders": 0, "products": 0, "customers": 0, "departments": 1, "applications": 0}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, {"id": 1, "code": "DEMO_ORG", "name": "示例车贷机构", "_count": {"funders": 1, "products": 1, "customers": 2, "departments": 2, "applications": 2}, "status": "ACTIVE", "address": "北京市朝阳区示例路 100 号", "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": "91110000DEMO000001", "contactName": "张经理", "packageType": "STANDARD", "contactPhone": "13810000000"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 05:46:15.105	\N
123	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=4000 200 9ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "4000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 05:46:15.106	\N
124	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=4000 200 14ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "4000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 05:46:15.129	\N
125	\N	5	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 11ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 2, "current": 1, "records": [{"id": 4, "code": "CAR_LOAN", "name": "车贷机构", "_count": {"funders": 0, "products": 0, "customers": 0, "departments": 1, "applications": 0}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, {"id": 1, "code": "DEMO_ORG", "name": "示例车贷机构", "_count": {"funders": 1, "products": 1, "customers": 2, "departments": 2, "applications": 2}, "status": "ACTIVE", "address": "北京市朝阳区示例路 100 号", "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": "91110000DEMO000001", "contactName": "张经理", "packageType": "STANDARD", "contactPhone": "13810000000"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 05:46:15.97	\N
129	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=1000 200 10ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "1000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 05:46:16.998	\N
130	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=1000 200 10ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "1000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 05:46:17.015	\N
128	\N	5	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 9ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 2, "current": 1, "records": [{"id": 4, "code": "CAR_LOAN", "name": "车贷机构", "_count": {"funders": 0, "products": 0, "customers": 0, "departments": 1, "applications": 0}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, {"id": 1, "code": "DEMO_ORG", "name": "示例车贷机构", "_count": {"funders": 1, "products": 1, "customers": 2, "departments": 2, "applications": 2}, "status": "ACTIVE", "address": "北京市朝阳区示例路 100 号", "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": "91110000DEMO000001", "contactName": "张经理", "packageType": "STANDARD", "contactPhone": "13810000000"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 05:46:16.996	\N
131	\N	5	Super	application	GET	GET /saas/api/application/order-list?pageNum=1&pageSize=10 200 61ms	{"body": {}, "query": {"pageNum": "1", "pageSize": "10"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":3,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":2,\\"uuid\\":\\"2\\",\\"customerName\\":\\"朱雨贵\\",\\"personName\\":\\"朱雨贵\\",\\"name\\":\\"朱雨贵\\",\\"phone\\":\\"18538529932\\",\\"telephone\\":\\"18538529932\\",\\"idCard\\":\\"412823199909044812\\",\\"vehicleId\\":2,\\"plateNumber\\":\\"苏UJ725L\\",\\"vehicleBrand\\":\\"小型轿车\\",\\"vehicleModel\\":\\"宝马牌BMWT200QL（BMW320L\\",\\"vehicleOwner\\":\\"陈发剑\\",\\"applicationNo\\":\\"APP202606031543330599\\",\\"orderNo\\":\\"APP202606031543330599\\",\\"creditOrderId\\":\\"APP202606031543330599\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[300000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":2000,\\"nodeCode\\":2000,\\"currentNodeName\\":\\"风控模型预审\\",\\"nodeName\\":\\"风控模型预审\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":2000,\\"phaseName\\":\\"风控模型预审\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderName\\":\\"示例银行资金方\\",\\"creatorId\\":5,\\"creatorName\\":\\"Super Admin\\",\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"remark\\":\\"移动端身份证信息提交自动创建订单草稿\\",\\"createdAt\\":{},\\"updatedAt\\":{}},{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":1,\\"uuid\\":\\"1\\",\\"customerName\\":\\"王小明\\",\\"personName\\":\\"王小明\\",\\"name\\":\\"王小明\\",\\"phone\\":\\"13910000001\\",\\"telephone\\":\\"13910000001\\",\\"idCard\\":\\"110101199001010011\\",\\"vehicleId\\":1,\\"plateNumber\\":\\"京A12345\\",\\"vehicleBrand\\":\\"大众\\",\\"vehicleModel\\":\\"迈腾\\",\\"vehicleOwner\\":\\"\\",\\"applicationNo\\":\\"APP-DEMO-0001\\",\\"orderNo\\":\\"APP-DEMO-0001\\",\\"creditOrderId\\":\\"APP-DEMO-0001\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[120000]},\\"term\\":24,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[680000]},\\"approvedAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[115000]},\\"approvedTerm\\":24,\\"approvedRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[660000]},\\"status\\":\\"PENDING_DISBURSEMENT\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":7000,\\"nodeCode\\":7000,\\"currentNodeName\\":\\"请款资料\\",\\"nodeName\\":\\"请款资料\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":7000,\\"phaseName\\":\\"请款资料\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderNam", "truncated": true}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 05:46:51.783	\N
132	\N	5	Super	m	GET	GET /saas/api/m/statistics/overview 200 0ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 05:48:32.703	\N
133	\N	5	Super	application	GET	GET /saas/api/application/order-list?pageNum=1&pageSize=10&nodeCode=1100 200 13ms	{"body": {}, "query": {"pageNum": "1", "nodeCode": "1100", "pageSize": "10"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 10, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 05:48:35.195	\N
134	\N	5	Super	application	GET	GET /saas/api/application/order-list?pageNum=1&pageSize=10&nodeCode=1200 200 16ms	{"body": {}, "query": {"pageNum": "1", "nodeCode": "1200", "pageSize": "10"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 10, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 05:48:39.363	\N
135	\N	5	Super	application	GET	GET /saas/api/application/order-list?pageNum=1&pageSize=10&nodeCode=4100 200 11ms	{"body": {}, "query": {"pageNum": "1", "nodeCode": "4100", "pageSize": "10"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 10, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 05:48:42.853	\N
136	\N	5	Super	m	GET	GET /saas/api/m/statistics/overview 200 1ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 06:04:04.785	\N
137	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=1000 200 48ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "1000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 06:15:44.762	\N
138	\N	5	Super	org	GET	GET /saas/api/org/list?current=1&size=200&status=ACTIVE 200 66ms	{"body": {}, "query": {"size": "200", "status": "ACTIVE", "current": "1"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 200, "total": 2, "current": 1, "records": [{"id": 4, "code": "CAR_LOAN", "name": "车贷机构", "_count": {"funders": 0, "products": 0, "customers": 0, "departments": 1, "applications": 0}, "status": "ACTIVE", "address": null, "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": null, "contactName": null, "packageType": "STANDARD", "contactPhone": null}, {"id": 1, "code": "DEMO_ORG", "name": "示例车贷机构", "_count": {"funders": 1, "products": 1, "customers": 2, "departments": 2, "applications": 2}, "status": "ACTIVE", "address": "北京市朝阳区示例路 100 号", "expireAt": null, "tenantId": 1, "createdAt": {}, "updatedAt": {}, "apiEnabled": true, "creditCode": "91110000DEMO000001", "contactName": "张经理", "packageType": "STANDARD", "contactPhone": "13810000000"}]}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 06:15:44.776	\N
139	\N	5	Super	application	GET	GET /saas/api/application/order-list?current=1&size=20&phaseCode=1000 200 36ms	{"body": {}, "query": {"size": "20", "current": "1", "phaseCode": "1000"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 20, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 06:15:44.805	\N
140	\N	5	Super	application	GET	GET /saas/api/application/order-list?pageNum=1&pageSize=10 200 83ms	{"body": {}, "query": {"pageNum": "1", "pageSize": "10"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":3,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":2,\\"uuid\\":\\"2\\",\\"customerName\\":\\"朱雨贵\\",\\"personName\\":\\"朱雨贵\\",\\"name\\":\\"朱雨贵\\",\\"phone\\":\\"18538529932\\",\\"telephone\\":\\"18538529932\\",\\"idCard\\":\\"412823199909044812\\",\\"vehicleId\\":2,\\"plateNumber\\":\\"苏UJ725L\\",\\"vehicleBrand\\":\\"小型轿车\\",\\"vehicleModel\\":\\"宝马牌BMWT200QL（BMW320L\\",\\"vehicleOwner\\":\\"陈发剑\\",\\"applicationNo\\":\\"APP202606031543330599\\",\\"orderNo\\":\\"APP202606031543330599\\",\\"creditOrderId\\":\\"APP202606031543330599\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[300000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":2000,\\"nodeCode\\":2000,\\"currentNodeName\\":\\"风控模型预审\\",\\"nodeName\\":\\"风控模型预审\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":2000,\\"phaseName\\":\\"风控模型预审\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderName\\":\\"示例银行资金方\\",\\"creatorId\\":5,\\"creatorName\\":\\"Super Admin\\",\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"remark\\":\\"移动端身份证信息提交自动创建订单草稿\\",\\"createdAt\\":{},\\"updatedAt\\":{}},{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":1,\\"uuid\\":\\"1\\",\\"customerName\\":\\"王小明\\",\\"personName\\":\\"王小明\\",\\"name\\":\\"王小明\\",\\"phone\\":\\"13910000001\\",\\"telephone\\":\\"13910000001\\",\\"idCard\\":\\"110101199001010011\\",\\"vehicleId\\":1,\\"plateNumber\\":\\"京A12345\\",\\"vehicleBrand\\":\\"大众\\",\\"vehicleModel\\":\\"迈腾\\",\\"vehicleOwner\\":\\"\\",\\"applicationNo\\":\\"APP-DEMO-0001\\",\\"orderNo\\":\\"APP-DEMO-0001\\",\\"creditOrderId\\":\\"APP-DEMO-0001\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[120000]},\\"term\\":24,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[680000]},\\"approvedAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[115000]},\\"approvedTerm\\":24,\\"approvedRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[660000]},\\"status\\":\\"PENDING_DISBURSEMENT\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":7000,\\"nodeCode\\":7000,\\"currentNodeName\\":\\"请款资料\\",\\"nodeName\\":\\"请款资料\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":7000,\\"phaseName\\":\\"请款资料\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderNam", "truncated": true}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 06:35:10.405	\N
141	\N	5	Super	application	GET	GET /saas/api/application/order-list?pageNum=1&pageSize=10 200 26ms	{"body": {}, "query": {"pageNum": "1", "pageSize": "10"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":3,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":2,\\"uuid\\":\\"2\\",\\"customerName\\":\\"朱雨贵\\",\\"personName\\":\\"朱雨贵\\",\\"name\\":\\"朱雨贵\\",\\"phone\\":\\"18538529932\\",\\"telephone\\":\\"18538529932\\",\\"idCard\\":\\"412823199909044812\\",\\"vehicleId\\":2,\\"plateNumber\\":\\"苏UJ725L\\",\\"vehicleBrand\\":\\"小型轿车\\",\\"vehicleModel\\":\\"宝马牌BMWT200QL（BMW320L\\",\\"vehicleOwner\\":\\"陈发剑\\",\\"applicationNo\\":\\"APP202606031543330599\\",\\"orderNo\\":\\"APP202606031543330599\\",\\"creditOrderId\\":\\"APP202606031543330599\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[300000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":2000,\\"nodeCode\\":2000,\\"currentNodeName\\":\\"风控模型预审\\",\\"nodeName\\":\\"风控模型预审\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":2000,\\"phaseName\\":\\"风控模型预审\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderName\\":\\"示例银行资金方\\",\\"creatorId\\":5,\\"creatorName\\":\\"Super Admin\\",\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"remark\\":\\"移动端身份证信息提交自动创建订单草稿\\",\\"createdAt\\":{},\\"updatedAt\\":{}},{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":1,\\"uuid\\":\\"1\\",\\"customerName\\":\\"王小明\\",\\"personName\\":\\"王小明\\",\\"name\\":\\"王小明\\",\\"phone\\":\\"13910000001\\",\\"telephone\\":\\"13910000001\\",\\"idCard\\":\\"110101199001010011\\",\\"vehicleId\\":1,\\"plateNumber\\":\\"京A12345\\",\\"vehicleBrand\\":\\"大众\\",\\"vehicleModel\\":\\"迈腾\\",\\"vehicleOwner\\":\\"\\",\\"applicationNo\\":\\"APP-DEMO-0001\\",\\"orderNo\\":\\"APP-DEMO-0001\\",\\"creditOrderId\\":\\"APP-DEMO-0001\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[120000]},\\"term\\":24,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[680000]},\\"approvedAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[115000]},\\"approvedTerm\\":24,\\"approvedRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[660000]},\\"status\\":\\"PENDING_DISBURSEMENT\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":7000,\\"nodeCode\\":7000,\\"currentNodeName\\":\\"请款资料\\",\\"nodeName\\":\\"请款资料\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":7000,\\"phaseName\\":\\"请款资料\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderNam", "truncated": true}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 06:35:40.477	\N
142	\N	5	Super	m	GET	GET /saas/api/m/credit/getCreditDetailByOrderId/APP-DEMO-0001 200 19ms	{"body": {}, "query": {}, "params": {"creditOrderId": "APP-DEMO-0001"}}	{"msg": "success", "code": 200, "data": {"id": 1, "name": "王小明", "uuid": "1", "phone": "13910000001", "remark": "示例进件数据", "status": 1, "periods": 24, "vehicle": {"id": 1, "uuid": "1", "address": null, "mileage": 42000, "sealInfo": null, "isMortgage": 2, "plateNumber": "京A12345", "usageNature": null, "vehicleCode": "Ldemo202605290001", "engineNumber": null, "registerDate": "", "vehicleBrand": "大众", "vehicleColor": "黑色", "vehicleModel": "迈腾", "vehicleOwner": null, "purchasePrice": 21000000, "vehicleImgUrl": ""}, "customer": {"id": 1, "race": null, "uuid": "1", "gender": 1, "nation": null, "telephone": "13910000001", "idcardBack": "", "personName": "王小明", "updateTime": "2026-06-03 18:50:25", "idcardFront": "", "personIdcard": "110101199001010011", "personAddress": "北京市海淀区示例小区 8 号", "personValidDateEnd": null, "personValidDateStart": null, "personIssuingAuthority": null}, "validAmt": "115000.00", "passQuota": "115000.00", "pushQuota": "120000.00", "createTime": "2026-06-01 10:04:33", "updateTime": "2026-06-03 18:50:26", "productName": "标准车抵贷", "businessNode": "LOAN_DISBURSEMENT", "creditOrderId": "APP-DEMO-0001"}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 06:35:42.968	\N
143	\N	5	Super	m	GET	GET /saas/api/m/credit/getCreditDetailByOrderId/APP202606031543330599 200 16ms	{"body": {}, "query": {}, "params": {"creditOrderId": "APP202606031543330599"}}	{"msg": "success", "code": 200, "data": {"id": 3, "name": "朱雨贵", "uuid": "2", "phone": "18538529932", "remark": "移动端身份证信息提交自动创建订单草稿", "status": 4, "periods": 12, "vehicle": {"id": 2, "uuid": "2", "address": "江苏省苏州市吴中区珠江小区123号楼605室", "mileage": 9000, "sealInfo": "市公安局交通警察支队", "isMortgage": 2, "plateNumber": "苏UJ725L", "usageNature": "非营运", "vehicleCode": "LBV8W3106HMH43140", "engineNumber": "37D168", "registerDate": "2017-07-14", "vehicleBrand": "小型轿车", "vehicleColor": null, "vehicleModel": "宝马牌BMWT200QL（BMW320L", "vehicleOwner": "陈发剑", "vehicleImgUrl": "/saas/api/uploads/images/202606/642c260e-cb5e-48c3-90b1-17511afe86c0.jpg"}, "customer": {"id": 2, "race": "1", "uuid": "2", "gender": 1, "nation": "1", "telephone": "18538529932", "idcardBack": "/saas/api/uploads/images/202606/632ff110-a769-4ba8-aa70-846be2fa6c52.jpg", "personName": "朱雨贵", "updateTime": "2026-06-03 17:46:05", "idcardFront": "/saas/api/uploads/images/202606/caf45c5e-3956-4c8e-b609-254d6a3d29ee.jpg", "personIdcard": "412823199909044812", "personAddress": "河南省遂平县阳丰乡大石桥村大石桥01-376", "personValidDateEnd": "2029-05-27", "personValidDateStart": "2019-05-27", "personIssuingAuthority": "遂平县公安局"}, "pushQuota": "300000.00", "createTime": "2026-06-03 15:43:33", "updateTime": "2026-06-03 17:47:24", "productName": "标准车抵贷", "businessNode": "PRE_AUDIT", "creditOrderId": "APP202606031543330599"}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 06:35:46.103	\N
144	\N	5	Super	m	GET	GET /saas/api/m/credit/getCreditDetailByOrderId/APP202606031543330599 200 18ms	{"body": {}, "query": {}, "params": {"creditOrderId": "APP202606031543330599"}}	{"msg": "success", "code": 200, "data": {"id": 3, "name": "朱雨贵", "uuid": "2", "phone": "18538529932", "remark": "移动端身份证信息提交自动创建订单草稿", "status": 4, "periods": 12, "vehicle": {"id": 2, "uuid": "2", "address": "江苏省苏州市吴中区珠江小区123号楼605室", "mileage": 9000, "sealInfo": "市公安局交通警察支队", "isMortgage": 2, "plateNumber": "苏UJ725L", "usageNature": "非营运", "vehicleCode": "LBV8W3106HMH43140", "engineNumber": "37D168", "registerDate": "2017-07-14", "vehicleBrand": "小型轿车", "vehicleColor": null, "vehicleModel": "宝马牌BMWT200QL（BMW320L", "vehicleOwner": "陈发剑", "vehicleImgUrl": "/saas/api/uploads/images/202606/642c260e-cb5e-48c3-90b1-17511afe86c0.jpg"}, "customer": {"id": 2, "race": "1", "uuid": "2", "gender": 1, "nation": "1", "telephone": "18538529932", "idcardBack": "/saas/api/uploads/images/202606/632ff110-a769-4ba8-aa70-846be2fa6c52.jpg", "personName": "朱雨贵", "updateTime": "2026-06-03 17:46:05", "idcardFront": "/saas/api/uploads/images/202606/caf45c5e-3956-4c8e-b609-254d6a3d29ee.jpg", "personIdcard": "412823199909044812", "personAddress": "河南省遂平县阳丰乡大石桥村大石桥01-376", "personValidDateEnd": "2029-05-27", "personValidDateStart": "2019-05-27", "personIssuingAuthority": "遂平县公安局"}, "pushQuota": "300000.00", "createTime": "2026-06-03 15:43:33", "updateTime": "2026-06-03 17:47:24", "productName": "标准车抵贷", "businessNode": "PRE_AUDIT", "creditOrderId": "APP202606031543330599"}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 06:35:49.833	\N
145	\N	5	Super	m	GET	GET /saas/api/m/statistics/overview 200 0ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 06:36:19.068	\N
146	\N	5	Super	m	GET	GET /saas/api/m/statistics/overview 200 0ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2026-06-08 07:03:34.389	\N
147	\N	5	Super	application	GET	GET /saas/api/application/order-list?pageNum=1&pageSize=10&nodeCode=1200 200 26ms	{"body": {}, "query": {"pageNum": "1", "nodeCode": "1200", "pageSize": "10"}, "params": {}}	{"msg": "success", "code": 200, "data": {"size": 10, "total": 0, "current": 1, "records": []}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 07:03:41.313	\N
148	\N	5	Super	m	GET	GET /saas/api/m/statistics/overview 200 1ms	{"body": {}, "query": {}, "params": {}}	{"msg": "success", "code": 200, "data": {"todayLeads": 0, "totalAmount": 0, "monthlyDeals": 0, "pendingApproval": 0}}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 07:03:43.614	\N
149	\N	5	Super	application	GET	GET /saas/api/application/order-list?pageNum=1&pageSize=10 200 51ms	{"body": {}, "query": {"pageNum": "1", "pageSize": "10"}, "params": {}}	{"preview": "{\\"code\\":200,\\"msg\\":\\"success\\",\\"data\\":{\\"records\\":[{\\"id\\":3,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":2,\\"uuid\\":\\"2\\",\\"customerName\\":\\"朱雨贵\\",\\"personName\\":\\"朱雨贵\\",\\"name\\":\\"朱雨贵\\",\\"phone\\":\\"18538529932\\",\\"telephone\\":\\"18538529932\\",\\"idCard\\":\\"412823199909044812\\",\\"vehicleId\\":2,\\"plateNumber\\":\\"苏UJ725L\\",\\"vehicleBrand\\":\\"小型轿车\\",\\"vehicleModel\\":\\"宝马牌BMWT200QL（BMW320L\\",\\"vehicleOwner\\":\\"陈发剑\\",\\"applicationNo\\":\\"APP202606031543330599\\",\\"orderNo\\":\\"APP202606031543330599\\",\\"creditOrderId\\":\\"APP202606031543330599\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[300000]},\\"term\\":12,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[360000]},\\"approvedAmount\\":null,\\"approvedTerm\\":null,\\"approvedRate\\":null,\\"status\\":\\"SUBMITTED\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":2000,\\"nodeCode\\":2000,\\"currentNodeName\\":\\"风控模型预审\\",\\"nodeName\\":\\"风控模型预审\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":2000,\\"phaseName\\":\\"风控模型预审\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderName\\":\\"示例银行资金方\\",\\"creatorId\\":5,\\"creatorName\\":\\"Super Admin\\",\\"supplementReason\\":null,\\"supplementDeadline\\":null,\\"remark\\":\\"移动端身份证信息提交自动创建订单草稿\\",\\"createdAt\\":{},\\"updatedAt\\":{}},{\\"id\\":1,\\"tenantId\\":1,\\"orgId\\":1,\\"orgName\\":\\"示例车贷机构\\",\\"customerId\\":1,\\"uuid\\":\\"1\\",\\"customerName\\":\\"王小明\\",\\"personName\\":\\"王小明\\",\\"name\\":\\"王小明\\",\\"phone\\":\\"13910000001\\",\\"telephone\\":\\"13910000001\\",\\"idCard\\":\\"110101199001010011\\",\\"vehicleId\\":1,\\"plateNumber\\":\\"京A12345\\",\\"vehicleBrand\\":\\"大众\\",\\"vehicleModel\\":\\"迈腾\\",\\"vehicleOwner\\":\\"\\",\\"applicationNo\\":\\"APP-DEMO-0001\\",\\"orderNo\\":\\"APP-DEMO-0001\\",\\"creditOrderId\\":\\"APP-DEMO-0001\\",\\"amount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[120000]},\\"term\\":24,\\"rate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[680000]},\\"approvedAmount\\":{\\"s\\":1,\\"e\\":5,\\"d\\":[115000]},\\"approvedTerm\\":24,\\"approvedRate\\":{\\"s\\":1,\\"e\\":-2,\\"d\\":[660000]},\\"status\\":\\"PENDING_DISBURSEMENT\\",\\"businessType\\":\\"CAR_LOAN\\",\\"currentNode\\":7000,\\"nodeCode\\":7000,\\"currentNodeName\\":\\"请款资料\\",\\"nodeName\\":\\"请款资料\\",\\"currentStatus\\":10,\\"nodeStatus\\":10,\\"currentStatusName\\":\\"处理中\\",\\"nodeStatusName\\":\\"处理中\\",\\"phaseCode\\":7000,\\"phaseName\\":\\"请款资料\\",\\"productId\\":1,\\"productName\\":\\"标准车抵贷\\",\\"funderId\\":1,\\"funderNam", "truncated": true}	127.0.0.1	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-06-08 07:03:50.314	\N
\.


--
-- Data for Name: Organization; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Organization" (id, name, code, "creditCode", "contactName", "contactPhone", address, status, "packageType", "expireAt", "apiEnabled", "createdAt", "updatedAt", "tenantId") FROM stdin;
4	车贷机构	CAR_LOAN	\N	\N	\N	\N	ACTIVE	STANDARD	\N	t	2026-06-01 06:04:20.152	2026-06-01 06:04:56.624	1
1	示例车贷机构	DEMO_ORG	91110000DEMO000001	张经理	13810000000	北京市朝阳区示例路 100 号	ACTIVE	STANDARD	\N	t	2026-06-01 02:04:33.273	2026-06-03 10:50:25.87	1
\.


--
-- Data for Name: Permission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Permission" (id, "menuId", title, "authMark", "createdAt", "updatedAt", "tenantId") FROM stdin;
25	21	Add	add	2026-06-01 09:43:04.371	2026-06-15 03:55:45.221	1
26	21	Edit	edit	2026-06-01 09:43:04.374	2026-06-15 03:55:45.221	1
27	21	Delete	delete	2026-06-01 09:43:04.376	2026-06-15 03:55:45.221	1
292	133	Add	add	2026-06-15 03:55:45.221	2026-06-15 03:55:45.221	1
293	133	Edit	edit	2026-06-15 03:55:45.221	2026-06-15 03:55:45.221	1
294	133	Delete	delete	2026-06-15 03:55:45.221	2026-06-15 03:55:45.221	1
295	134	Add	add	2026-06-15 03:55:45.221	2026-06-15 03:55:45.221	1
296	134	Edit	edit	2026-06-15 03:55:45.221	2026-06-15 03:55:45.221	1
297	134	Delete	delete	2026-06-15 03:55:45.221	2026-06-15 03:55:45.221	1
298	135	Add	add	2026-06-15 03:55:45.221	2026-06-15 03:55:45.221	1
299	135	Edit	edit	2026-06-15 03:55:45.221	2026-06-15 03:55:45.221	1
300	135	Delete	delete	2026-06-15 03:55:45.221	2026-06-15 03:55:45.221	1
301	136	Add	add	2026-06-15 03:55:45.221	2026-06-15 03:55:45.221	1
302	136	Edit	edit	2026-06-15 03:55:45.221	2026-06-15 03:55:45.221	1
303	136	Delete	delete	2026-06-15 03:55:45.221	2026-06-15 03:55:45.221	1
304	137	Add	add	2026-06-15 03:55:45.221	2026-06-15 03:55:45.221	1
305	137	Edit	edit	2026-06-15 03:55:45.221	2026-06-15 03:55:45.221	1
306	137	Delete	delete	2026-06-15 03:55:45.221	2026-06-15 03:55:45.221	1
307	138	Add	add	2026-06-15 03:55:45.221	2026-06-15 03:55:45.221	1
308	138	Edit	edit	2026-06-15 03:55:45.221	2026-06-15 03:55:45.221	1
309	138	Delete	delete	2026-06-15 03:55:45.221	2026-06-15 03:55:45.221	1
2	7	Add	add	2026-05-27 01:11:44.552	2026-06-15 03:55:45.221	1
3	7	Edit	edit	2026-05-27 01:11:44.554	2026-06-15 03:55:45.221	1
1	7	Delete	delete	2026-05-27 01:11:44.553	2026-06-15 03:55:45.221	1
79	26	Add	add	2026-06-01 09:43:04.62	2026-06-15 03:55:45.221	1
80	26	Edit	edit	2026-06-01 09:43:04.625	2026-06-15 03:55:45.221	1
81	26	Delete	delete	2026-06-01 09:43:04.632	2026-06-15 03:55:45.221	1
82	27	Add	add	2026-06-01 09:43:04.637	2026-06-15 03:55:45.221	1
83	27	Edit	edit	2026-06-01 09:43:04.645	2026-06-15 03:55:45.221	1
84	27	Delete	delete	2026-06-01 09:43:04.65	2026-06-15 03:55:45.221	1
265	132	Add	add	2026-06-02 13:34:12.196	2026-06-15 03:55:45.221	1
266	132	Edit	edit	2026-06-02 13:34:12.196	2026-06-15 03:55:45.221	1
267	132	Delete	delete	2026-06-02 13:34:12.196	2026-06-15 03:55:45.221	1
85	29	Add	add	2026-06-01 09:43:04.656	2026-06-15 03:55:45.221	1
86	29	Edit	edit	2026-06-01 09:43:04.661	2026-06-15 03:55:45.221	1
87	29	Delete	delete	2026-06-01 09:43:04.667	2026-06-15 03:55:45.221	1
88	31	Add	add	2026-06-01 09:43:04.674	2026-06-15 03:55:45.221	1
89	31	Edit	edit	2026-06-01 09:43:04.68	2026-06-15 03:55:45.221	1
90	31	Delete	delete	2026-06-01 09:43:04.694	2026-06-15 03:55:45.221	1
4	13	Add	add	2026-06-01 09:43:04.311	2026-06-15 03:55:45.221	1
5	13	Edit	edit	2026-06-01 09:43:04.316	2026-06-15 03:55:45.221	1
6	13	Delete	delete	2026-06-01 09:43:04.319	2026-06-15 03:55:45.221	1
7	14	Add	add	2026-06-01 09:43:04.322	2026-06-15 03:55:45.221	1
8	14	Edit	edit	2026-06-01 09:43:04.324	2026-06-15 03:55:45.221	1
9	14	Delete	delete	2026-06-01 09:43:04.327	2026-06-15 03:55:45.221	1
10	15	Add	add	2026-06-01 09:43:04.33	2026-06-15 03:55:45.221	1
11	15	Edit	edit	2026-06-01 09:43:04.333	2026-06-15 03:55:45.221	1
12	15	Delete	delete	2026-06-01 09:43:04.336	2026-06-15 03:55:45.221	1
13	16	Add	add	2026-06-01 09:43:04.34	2026-06-15 03:55:45.221	1
14	16	Edit	edit	2026-06-01 09:43:04.343	2026-06-15 03:55:45.221	1
15	16	Delete	delete	2026-06-01 09:43:04.345	2026-06-15 03:55:45.221	1
16	17	Add	add	2026-06-01 09:43:04.348	2026-06-15 03:55:45.221	1
17	17	Edit	edit	2026-06-01 09:43:04.35	2026-06-15 03:55:45.221	1
18	17	Delete	delete	2026-06-01 09:43:04.353	2026-06-15 03:55:45.221	1
19	18	Add	add	2026-06-01 09:43:04.356	2026-06-15 03:55:45.221	1
20	18	Edit	edit	2026-06-01 09:43:04.358	2026-06-15 03:55:45.221	1
28	34	Add	add	2026-06-01 09:43:04.379	2026-06-15 02:12:49.925	1
29	34	Edit	edit	2026-06-01 09:43:04.381	2026-06-15 02:12:49.925	1
30	34	Delete	delete	2026-06-01 09:43:04.383	2026-06-15 02:12:49.925	1
31	35	Add	add	2026-06-01 09:43:04.386	2026-06-15 02:12:49.925	1
32	35	Edit	edit	2026-06-01 09:43:04.388	2026-06-15 02:12:49.925	1
33	35	Delete	delete	2026-06-01 09:43:04.391	2026-06-15 02:12:49.925	1
34	36	Add	add	2026-06-01 09:43:04.393	2026-06-15 02:12:49.925	1
35	36	Edit	edit	2026-06-01 09:43:04.396	2026-06-15 02:12:49.925	1
36	36	Delete	delete	2026-06-01 09:43:04.398	2026-06-15 02:12:49.925	1
37	37	Add	add	2026-06-01 09:43:04.401	2026-06-15 02:12:49.925	1
38	37	Edit	edit	2026-06-01 09:43:04.406	2026-06-15 02:12:49.925	1
39	37	Delete	delete	2026-06-01 09:43:04.414	2026-06-15 02:12:49.925	1
40	38	Add	add	2026-06-01 09:43:04.419	2026-06-15 02:12:49.925	1
41	38	Edit	edit	2026-06-01 09:43:04.424	2026-06-15 02:12:49.925	1
42	38	Delete	delete	2026-06-01 09:43:04.429	2026-06-15 02:12:49.925	1
43	39	Add	add	2026-06-01 09:43:04.435	2026-06-15 02:12:49.925	1
44	39	Edit	edit	2026-06-01 09:43:04.439	2026-06-15 02:12:49.925	1
45	39	Delete	delete	2026-06-01 09:43:04.445	2026-06-15 02:12:49.925	1
46	40	Add	add	2026-06-01 09:43:04.454	2026-06-15 02:12:49.925	1
47	40	Edit	edit	2026-06-01 09:43:04.458	2026-06-15 02:12:49.925	1
48	40	Delete	delete	2026-06-01 09:43:04.462	2026-06-15 02:12:49.925	1
49	41	Add	add	2026-06-01 09:43:04.468	2026-06-15 02:12:49.925	1
50	41	Edit	edit	2026-06-01 09:43:04.472	2026-06-15 02:12:49.925	1
51	41	Delete	delete	2026-06-01 09:43:04.477	2026-06-15 02:12:49.925	1
52	42	Add	add	2026-06-01 09:43:04.483	2026-06-15 02:12:49.925	1
53	42	Edit	edit	2026-06-01 09:43:04.489	2026-06-15 02:12:49.925	1
54	42	Delete	delete	2026-06-01 09:43:04.493	2026-06-15 02:12:49.925	1
55	43	Add	add	2026-06-01 09:43:04.499	2026-06-15 02:12:49.925	1
56	43	Edit	edit	2026-06-01 09:43:04.504	2026-06-15 02:12:49.925	1
57	43	Delete	delete	2026-06-01 09:43:04.509	2026-06-15 02:12:49.925	1
58	44	Add	add	2026-06-01 09:43:04.514	2026-06-15 02:12:49.925	1
59	44	Edit	edit	2026-06-01 09:43:04.518	2026-06-15 02:12:49.925	1
60	44	Delete	delete	2026-06-01 09:43:04.523	2026-06-15 02:12:49.925	1
61	45	Add	add	2026-06-01 09:43:04.527	2026-06-15 02:12:49.925	1
62	45	Edit	edit	2026-06-01 09:43:04.532	2026-06-15 02:12:49.925	1
63	45	Delete	delete	2026-06-01 09:43:04.536	2026-06-15 02:12:49.925	1
64	46	Add	add	2026-06-01 09:43:04.541	2026-06-15 02:12:49.925	1
65	46	Edit	edit	2026-06-01 09:43:04.545	2026-06-15 02:12:49.925	1
66	46	Delete	delete	2026-06-01 09:43:04.549	2026-06-15 02:12:49.925	1
67	47	Add	add	2026-06-01 09:43:04.554	2026-06-15 02:12:49.925	1
68	47	Edit	edit	2026-06-01 09:43:04.558	2026-06-15 02:12:49.925	1
69	47	Delete	delete	2026-06-01 09:43:04.562	2026-06-15 02:12:49.925	1
70	48	Add	add	2026-06-01 09:43:04.566	2026-06-15 02:12:49.925	1
71	48	Edit	edit	2026-06-01 09:43:04.572	2026-06-15 02:12:49.925	1
72	48	Delete	delete	2026-06-01 09:43:04.579	2026-06-15 02:12:49.925	1
73	49	Add	add	2026-06-01 09:43:04.585	2026-06-15 02:12:49.925	1
74	49	Edit	edit	2026-06-01 09:43:04.589	2026-06-15 02:12:49.925	1
75	49	Delete	delete	2026-06-01 09:43:04.595	2026-06-15 02:12:49.925	1
21	18	Delete	delete	2026-06-01 09:43:04.36	2026-06-15 03:55:45.221	1
22	20	Add	add	2026-06-01 09:43:04.363	2026-06-15 03:55:45.221	1
23	20	Edit	edit	2026-06-01 09:43:04.366	2026-06-15 03:55:45.221	1
24	20	Delete	delete	2026-06-01 09:43:04.369	2026-06-15 03:55:45.221	1
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Product" (id, "orgId", name, "productType", "minRate", "maxRate", "minAmount", "maxAmount", "minTerm", "maxTerm", "repaymentMethod", "minAge", "maxAge", "maxCarAge", "maxMileage", "ltvLimit", "minDownPayment", regions, status, "fileChecklist", "createdAt", "updatedAt", "tenantId", "applicableFunders", "accessConditions", "valuationDiscountRate") FROM stdin;
1	1	标准车抵贷	CAR_LOAN	0.0360	0.1080	50000.00	500000.00	6	36	等额本息	22	60	8	150000	0.8000	0.2000	北京,天津,河北	ACTIVE	["身份证", "行驶证", "登记证", "银行卡"]	2026-06-01 02:04:33.301	2026-06-03 10:50:25.961	1	\N	\N	\N
\.


--
-- Data for Name: RepaymentPlan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RepaymentPlan" (id, "applicationId", period, "dueDate", principal, interest, "totalAmount", "paidPrincipal", "paidInterest", "paidTotal", status, "overdueDays", "penaltyAmount", "paidAt", "createdAt", "updatedAt", "tenantId") FROM stdin;
1	1	1	2026-06-28 16:00:00	4791.67	632.50	5424.17	0.00	0.00	0.00	NOT_DUE	0	0.00	\N	2026-06-01 02:04:33.426	2026-06-03 10:50:26.082	1
\.


--
-- Data for Name: RepaymentRecord; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RepaymentRecord" (id, "planId", amount, principal, interest, penalty, "paymentMethod", "transactionNo", "voucherUrl", remark, "createdBy", "createdAt", "tenantId") FROM stdin;
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Role" (id, name, code, description, enabled, "createdAt", "updatedAt", "tenantId", "dataScope") FROM stdin;
3	Super Admin	R_SUPER	平台超级管理员，全平台管理	t	2026-06-01 02:04:32.923	2026-06-15 03:55:45.221	1	ALL
10	Platform Operator	R_OPERATION	平台运营	t	2026-06-01 08:12:51.063	2026-06-15 03:55:45.221	1	ALL
6	Admin	R_ADMIN	机构管理员	t	2026-06-01 02:04:32.923	2026-06-15 03:55:45.221	1	ALL
1	Sales Manager	R_SALES_MANAGER	部门经理/团队负责人	t	2026-06-01 02:04:32.923	2026-06-15 03:55:45.221	1	DEPT
4	Sales	R_SALES	业务员/客户经理	t	2026-06-01 02:04:32.923	2026-06-15 03:55:45.221	1	SELF
2	Approver	R_APPROVER	风控审批员	t	2026-06-01 02:04:32.923	2026-06-15 03:55:45.221	1	ALL
7	Finance	R_FINANCE	财务人员	t	2026-06-01 02:04:32.923	2026-06-15 03:55:45.221	1	ALL
16	CS & Collection	R_CS_COLLECTION	客服/催收	t	2026-06-01 08:12:51.088	2026-06-15 03:55:45.221	1	ALL
5	User	R_USER	普通用户，仅移动端操作权限	t	2026-06-01 02:04:32.923	2026-06-15 03:55:45.221	1	SELF
\.


--
-- Data for Name: RoleMenu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RoleMenu" ("roleId", "menuId") FROM stdin;
5	2
5	3
5	1
6	4
6	138
6	132
6	6
6	134
6	135
6	133
6	2
6	7
6	136
6	137
6	3
6	33
6	1
6	5
6	8
4	134
4	133
4	2
4	136
4	137
4	3
4	33
4	1
3	1
3	2
3	3
3	12
3	13
3	14
3	15
3	16
3	17
3	18
3	19
3	20
3	21
3	4
3	5
3	6
3	7
3	26
3	27
3	132
3	28
3	29
3	30
3	31
3	8
3	33
3	133
3	134
3	135
3	136
3	137
3	138
7	138
7	134
7	133
7	2
7	136
7	137
7	3
7	33
7	1
2	134
2	135
2	133
2	2
2	136
2	137
2	3
2	33
2	1
10	31
10	14
10	13
10	2
10	16
10	15
10	12
10	19
10	21
10	3
10	17
10	20
10	1
10	18
16	2
16	3
16	1
1	138
1	134
1	133
1	2
1	136
1	137
1	3
1	33
1	1
\.


--
-- Data for Name: RolePermission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RolePermission" ("roleId", "permissionId") FROM stdin;
3	2
\.


--
-- Data for Name: SignRecord; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SignRecord" (id, "applicationId", status, "contractUrl", "signedAt", "videoUrl", "expiredAt", "cancelledReason", "createdAt", "updatedAt", "tenantId") FROM stdin;
1	1	SIGNED	https://example.com/contracts/APP-DEMO-0001.pdf	2026-05-29 01:30:00	https://example.com/videos/APP-DEMO-0001.mp4	\N	\N	2026-06-01 02:04:33.411	2026-06-03 10:50:26.07	1
\.


--
-- Data for Name: Tenant; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Tenant" (id, name, code, status, "createdAt", "updatedAt") FROM stdin;
1	Default Tenant	default	active	2026-06-01 02:04:05.755	2026-06-01 02:04:05.755
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, "userName", "passwordHash", "nickName", gender, phone, email, avatar, status, "createdBy", "updatedBy", "createdAt", "updatedAt", "tenantId", "deptId") FROM stdin;
3	User	$2a$10$dSVCUCCzEsgBF5qCnXwiz.mjNJHXwlFuOZOLpkFSzUzLyOypGxQSC	User	Unknown	13800000008	user@example.com	\N	ONLINE	system	system	2026-06-01 02:04:32.952	2026-06-03 10:50:25.193	1	\N
6	Admin	$2a$10$dSVCUCCzEsgBF5qCnXwiz.mjNJHXwlFuOZOLpkFSzUzLyOypGxQSC	Admin	Female	13800000002	admin@example.com	\N	ONLINE	system	system	2026-06-01 02:04:32.952	2026-06-03 10:50:25.193	1	\N
1	Sales	$2a$10$dSVCUCCzEsgBF5qCnXwiz.mjNJHXwlFuOZOLpkFSzUzLyOypGxQSC	Sales	Unknown	13800000003	sales@example.com	\N	ONLINE	system	system	2026-06-01 02:04:32.952	2026-06-03 10:50:25.949	1	1
5	Super	$2a$10$dSVCUCCzEsgBF5qCnXwiz.mjNJHXwlFuOZOLpkFSzUzLyOypGxQSC	Super Admin	Male	13800000001	super@example.com	\N	ONLINE	system	system	2026-06-01 02:04:32.952	2026-06-03 10:50:25.193	1	\N
4	Approver	$2a$10$dSVCUCCzEsgBF5qCnXwiz.mjNJHXwlFuOZOLpkFSzUzLyOypGxQSC	Approver	Unknown	13800000004	approver@example.com	\N	ONLINE	system	system	2026-06-01 02:04:32.952	2026-06-03 10:50:25.193	1	\N
7	mobile_sales	$2a$10$OmVk5IemvdgqmkliiTHvguMcUNtrr.07Rh7qqatAyqaTqqK69ao5.	移动端测试业务员	Unknown	13818821494	mobile_sales@example.com	\N	ONLINE	hermes	hermes	2026-06-01 06:19:48.731	2026-06-01 06:19:48.731	1	3
2	Finance	$2a$10$dSVCUCCzEsgBF5qCnXwiz.mjNJHXwlFuOZOLpkFSzUzLyOypGxQSC	Finance	Unknown	13800000005	finance@example.com	\N	ONLINE	system	system	2026-06-01 02:04:32.952	2026-06-03 10:50:25.193	1	\N
11	Operator	$2a$10$dSVCUCCzEsgBF5qCnXwiz.mjNJHXwlFuOZOLpkFSzUzLyOypGxQSC	Operator	Unknown	13800000007	operator@example.com	\N	ONLINE	system	system	2026-06-03 10:50:25.193	2026-06-03 10:50:25.193	1	\N
13	CS	$2a$10$dSVCUCCzEsgBF5qCnXwiz.mjNJHXwlFuOZOLpkFSzUzLyOypGxQSC	CS	Unknown	13800000006	cs@example.com	\N	ONLINE	system	system	2026-06-03 10:50:25.193	2026-06-03 10:50:25.193	1	\N
\.


--
-- Data for Name: UserRole; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserRole" ("userId", "roleId") FROM stdin;
6	6
3	5
5	3
4	2
7	4
11	10
13	16
1	4
2	7
\.


--
-- Data for Name: Vehicle; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Vehicle" (id, "customerId", vin, "plateNumber", brand, model, color, year, mileage, "purchasePrice", "estimateValue", "isMortgaged", "mortgageInfo", "createdAt", "updatedAt", "ownerName", address, "usageNature", "sealInfo", "engineNumber", "registerDate", "vehicleImgUrl") FROM stdin;
2	2	LBV8W3106HMH43140	苏UJ725L	小型轿车	宝马牌BMWT200QL（BMW320L	\N	\N	9000	\N	\N	f	\N	2026-06-03 09:47:14.501	2026-06-03 09:47:14.501	陈发剑	江苏省苏州市吴中区珠江小区123号楼605室	非营运	市公安局交通警察支队	37D168	2017-07-14 00:00:00	images/202606/642c260e-cb5e-48c3-90b1-17511afe86c0.jpg
1	1	Ldemo202605290001	京A12345	大众	迈腾	黑色	2021	42000	210000.00	160000.00	f	\N	2026-06-01 02:04:33.339	2026-06-03 10:50:25.997	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
22be78ad-d47d-4159-998b-afd74f23a520	be87594a006d815cd3bb9ac16d5c40eebb147940b87cb952224c36910d49711a	2026-06-01 02:04:05.74361+00	20260526072140	\N	\N	2026-06-01 02:04:05.665979+00	1
9c4c543e-7f0f-4e6c-86e2-25acfadbf8b4	330b4104cd2d131898b1ab3b234795d07b7cde2494073f179d1053f0341b9c9b	2026-06-01 02:04:05.804307+00	20260527031800_add_multi_tenant	\N	\N	2026-06-01 02:04:05.746641+00	1
0a155f9f-c348-4f1b-86aa-3520b8e8ff09	7a033ad06df88e4153c0070c63676cfb681d549b150088644587b4e0b9fce501	2026-06-02 10:54:14.80622+00	20260602171000_fix_flow_config_menu_component	\N	\N	2026-06-02 10:54:14.79815+00	1
03473d46-447d-4ef7-b457-ac6ab3cf491d	19616e416272faff0bb2f7aa84e9580f523a20e347c549b9d63deb6247bc8b3f	2026-06-01 02:04:06.107253+00	20260529031558_init_carloan_business_schema	\N	\N	2026-06-01 02:04:05.80783+00	1
b8c90080-0a97-45a1-b487-1a526fd8120a	e0d55c8a13d12adb17f3befbfe163e90a29389450a7f29977366e09b4edd4008	2026-06-01 02:04:06.12167+00	20260529090000_add_user_center_menu	\N	\N	2026-06-01 02:04:06.10962+00	1
e4e7c1db-275a-4dec-bf86-32325b40734d	75c4c1e867487624af7677695a7c7357d517aeb1a82a4aa7d5856d2ff1775c3d	2026-06-05 09:19:12.017644+00	20260605183500_configure_data_center_pages	\N	\N	2026-06-05 09:19:12.00662+00	1
7a124866-2bd0-4a16-ac59-bc1a1539e139	238be0702bb6a6c7ae170825c9008687df550450a0063b63a4ad8d3070a6aa61	2026-06-01 02:04:06.205956+00	20260529113000_add_tenant_to_business_tables	\N	\N	2026-06-01 02:04:06.125138+00	1
af2cfd3b-1d37-4bcd-aa63-5507b13d61ff	3cccae830800260d38d445c1e85360733c6ba30a0c268fd1d97cee5d4416fe2e	2026-06-02 10:54:14.826084+00	20260602172000_seed_default_flow_config	\N	\N	2026-06-02 10:54:14.808223+00	1
eba974d1-896e-407a-8739-21faaa6fb068	445bab495dee00c4d21eb6f6f2e04e3a73d30e13e155ef38f40e45e3e6e14180	2026-06-01 03:58:34.751419+00	20260601093000_enhance_org_product_funder	\N	\N	2026-06-01 03:58:34.733232+00	1
21ee8b8f-ad8c-4f04-a9f7-bd9f4ce48557	c84e75fcb28f4f1d7523c13ab2bd178fba6b203c56220bb7a9faf79058f8ace5	2026-06-01 10:41:06.009262+00	20260601172000_add_dict_tables	\N	\N	2026-06-01 10:41:05.937406+00	1
d613b20f-1501-4645-9b81-c3c58493a453	f1eb3996265c453dee1039b1302581dc9203c01e539d147286f29d301c81e67d	2026-06-02 02:00:11.485988+00	20260602093000_add_flow_config	\N	\N	2026-06-02 02:00:11.421808+00	1
dc98a16f-5134-4758-8ae4-dd60bf0c0223	6ca4de6cf23d2d58ce95fa435e1f096277807018ff90503cbc5d865d890490f4	2026-06-03 07:42:35.030211+00	20260602173000_add_application_flow_state	\N	\N	2026-06-03 07:42:34.994762+00	1
0c4a305a-bdde-424a-848a-643a76a5a8eb	f2bed3ca6db467f9dac72302cc3065d9a7f6bdb9757f7e604ed5dbdbbebce1cc	2026-06-02 05:05:14.345905+00	20260602094500_add_file_assets	\N	\N	2026-06-02 05:05:14.300027+00	1
3213a785-9274-475e-972e-0d7fe05de8e2	81735c5416fa8b65522a41fd52f7ac409332b74032174801b8c0a11812545067	2026-06-02 06:46:39.979323+00	20260602143000_fix_file_config_menu_component	\N	\N	2026-06-02 06:46:39.965811+00	1
da123bc9-e122-4497-8684-c9c73610a08f	4a406b5c37ab435245c34a4d9db2aeae1e2affde3c5ae020666d77219f26c751	2026-06-02 06:57:48.540348+00	20260602144500_add_file_manage_menu	\N	\N	2026-06-02 06:57:48.517715+00	1
48d9e54e-6db7-4219-a1ae-8fc9c4a47d8d	2a7948d94167146b822009209108f3a4937672518bea89b63079c60b88ec3883	2026-06-03 10:50:12.776325+00	20260603183000_extend_application_status_flow	\N	\N	2026-06-03 10:50:12.761904+00	1
5855e020-fc0d-4677-af8d-a6e7cff11fa4	eeb3563291f615bddf7c5a6c90d08aa1d200ddf3fce9b36fdef88306b3e9d552	2026-06-02 08:16:51.678634+00	20260602155500_fix_core_system_menu_components	\N	\N	2026-06-02 08:16:51.665617+00	1
9840ddbe-9d98-4c1d-aefb-21ef4c21e10a	b9af44eb40373cb8ec076501bed1032c0ba5da1540f1bd8cb7c20e2eb9a0c7d9	2026-06-02 09:56:31.873973+00	20260602162000_add_mobile_entry_fields	\N	\N	2026-06-02 09:56:31.857896+00	1
b44430f9-7329-4970-a9ab-0d337adbefa3	ab5a08d8d9abce7f30295b88db869fdf709a80504a2dcf48fa179f6a6e06ac42	2026-06-05 09:03:58.414286+00	20260605172000_simplify_business_phase_menus	\N	\N	2026-06-05 09:03:58.397626+00	1
191c6d12-f7cc-4de0-844a-599d8c7c0eaf	9df8db0b3e0aa3d7bed148385451b834e7570e8a0127714297739140a7bd2526	2026-06-05 09:08:45.977207+00	20260605174500_move_business_config_menus_to_platform	\N	\N	2026-06-05 09:08:45.942182+00	1
ce37ecff-8150-416c-a1e6-fae8473cb372	2c001cec06a8716b40fd834a892f906f50af565575e79092c4a69f400dfc0018	2026-06-05 09:10:51.57521+00	20260605180500_hide_duplicate_org_config_menu	\N	\N	2026-06-05 09:10:51.544434+00	1
effccf19-d442-445a-af0d-50f5d8c2397a	555d6d82f0b221452feb46655615fa0270e8dc14bcd35cdb02a7c35f1632cb45	2026-06-05 09:19:12.002283+00	20260605182500_add_operation_log_tenant_id	\N	\N	2026-06-05 09:19:11.984523+00	1
\.


--
-- Data for Name: backup_Menu_20260615032504; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."backup_Menu_20260615032504" (id, "parentId", path, name, component, title, icon, sort, "keepAlive", hidden, "hiddenTab", link, iframe, "createdAt", "updatedAt", "tenantId") FROM stdin;
24	\N	/platform	Platform	/index/index	平台管理	ri:global-line	20	f	f	f	\N	f	2026-06-01 08:12:51.106	2026-06-05 07:38:06.655	1
25	24	tenant	TenantMgmt	/business/common-list	租户机构管理	ri:building-2-line	21	t	f	f	\N	f	2026-06-01 08:12:51.111	2026-06-05 07:38:06.66	1
61	24	org-config	OrgConfig	/business/common-list	机构配置	ri:tools-line	72	t	t	t	\N	f	2026-06-01 08:12:51.229	2026-06-05 09:10:51.557	1
32	31	stats	DataStats	/data-center/stats	数据统计	ri:bar-chart-line	31	t	f	f	\N	f	2026-06-01 08:12:51.135	2026-06-05 09:19:12.217	1
26	24	package-billing	PackageBilling	/business/common-list	套餐与计费	ri:money-dollar-circle-line	22	t	f	f	\N	f	2026-06-01 08:12:51.115	2026-06-05 07:38:06.666	1
33	31	audit-log	AuditLog	/data-center/audit-log	日志审计	ri:file-list-3-line	32	t	f	f	\N	f	2026-06-01 08:12:51.139	2026-06-05 09:19:12.217	1
30	24	work-order	WorkOrder	/business/common-list	运营工单中心	ri:customer-service-2-line	26	t	f	f	\N	f	2026-06-01 08:12:51.129	2026-06-05 07:38:06.684	1
6	4	role	Role	/system/role	角色管理	ri:user-settings-line	42	t	f	f	\N	f	2026-06-01 02:04:33.001	2026-06-05 07:38:06.711	1
7	4	menu	Menus	/system/menu	菜单管理	ri:menu-line	43	t	f	f	\N	f	2026-06-01 02:04:33.004	2026-06-05 07:38:06.716	1
42	4	sys-param	SysParam	/business/common-list	系统参数	ri:settings-line	49	t	f	f	\N	f	2026-06-01 08:12:51.166	2026-06-05 07:38:06.743	1
43	4	notice	Notice	/business/common-list	公告管理	ri:notification-line	50	t	f	f	\N	f	2026-06-01 08:12:51.169	2026-06-05 07:38:06.748	1
8	4	user-center	UserCenter	/business/common-list	用户中心	ri:user-line	51	t	t	t	\N	f	2026-06-01 02:04:33.007	2026-06-05 07:38:06.752	1
9	\N	/business	Business	/index/index	业务管理	ri:briefcase-line	60	f	f	f	\N	f	2026-06-01 02:04:33.013	2026-06-05 07:38:06.755	1
31	\N	/datacenter	DataCenter	/index/index	数据中心	ri:bar-chart-box-line	30	f	f	f	\N	f	2026-06-01 08:12:51.132	2026-06-05 07:38:06.688	1
4	\N	/system	System	/index/index	系统管理	ri:settings-3-line	40	f	f	f	\N	f	2026-06-01 02:04:32.994	2026-06-05 07:38:06.702	1
5	4	user	User	/system/user	用户管理	ri:user-line	41	t	f	f	\N	f	2026-06-01 02:04:32.997	2026-06-05 07:38:06.707	1
17	9	approval	Approval	/business/common-list	审批管理	ri:shield-check-line	70	t	t	f	\N	f	2026-06-01 02:04:33.041	2026-06-05 07:38:06.799	1
1	\N	/dashboard	Dashboard	/index/index	仪表盘	ri:dashboard-line	10	f	f	f	\N	f	2026-06-01 02:04:32.977	2026-06-05 07:38:06.632	1
2	1	console	Console	/dashboard/console	工作台	ri:computer-line	11	t	f	f	\N	f	2026-06-01 02:04:32.985	2026-06-05 07:38:06.644	1
27	24	product-template	ProductTemplate	/business/common-list	产品与资方模板	ri:file-copy-line	23	t	f	f	\N	f	2026-06-01 08:12:51.117	2026-06-05 07:38:06.671	1
28	24	supervision	PlatformSupervision	/business/common-list	平台业务监管	ri:eye-line	24	t	f	f	\N	f	2026-06-01 08:12:51.12	2026-06-05 07:38:06.674	1
29	24	third-party	ThirdPartyService	/business/common-list	第三方服务管理	ri:plug-line	25	t	f	f	\N	f	2026-06-01 08:12:51.125	2026-06-05 07:38:06.68	1
3	1	analysis	Analysis	/dashboard/analysis	分析页	ri:line-chart-line	12	t	f	f	\N	f	2026-06-01 02:04:32.99	2026-06-05 07:38:06.65	1
38	4	dict	DictMgmt	/system/dict	字典管理	ri:book-open-line	44	t	f	f	\N	f	2026-06-01 08:12:51.153	2026-06-05 07:38:06.72	1
39	4	region	RegionMgmt	/business/common-list	地区管理	ri:map-pin-line	45	t	f	f	\N	f	2026-06-01 08:12:51.157	2026-06-05 07:38:06.725	1
226	4	file	FileManage	/system/file	文件管理	ri:file-list-3-line	46	t	f	f	\N	f	2026-06-02 06:57:45.178	2026-06-05 07:38:06.73	1
40	4	file-config	FileConfig	/system/file-config	文件存储配置	ri:hard-drive-2-line	47	t	f	f	\N	f	2026-06-01 08:12:51.161	2026-06-05 07:38:06.735	1
41	4	msg-template	MsgTemplate	/business/common-list	消息模板	ri:mail-send-line	48	t	f	f	\N	f	2026-06-01 08:12:51.163	2026-06-05 07:38:06.739	1
18	9	signing	Signing	/business/common-list	签约管理	ri:pen-nib-line	71	t	t	f	\N	f	2026-06-01 02:04:33.045	2026-06-05 07:38:06.803	1
60	9	reports	Reports	/business/common-list	报表统计	ri:pie-chart-line	76	t	t	f	\N	f	2026-06-01 08:12:51.226	2026-06-05 07:38:06.824	1
14	9	lead	Lead	/business/common-list	线索管理	ri:customer-service-line	66	t	t	f	\N	f	2026-06-01 02:04:33.031	2026-06-05 07:38:06.781	1
19	9	disbursement	Disbursement	/business/common-list	放款管理	ri:money-cny-circle-line	72	t	t	f	\N	f	2026-06-01 02:04:33.049	2026-06-05 07:38:06.807	1
57	9	order	OrderMgmt	/business/common-list	订单管理	ri:file-list-2-line	73	t	t	f	\N	f	2026-06-01 08:12:51.214	2026-06-05 07:38:06.811	1
20	9	repayment	Repayment	/business/common-list	还款管理	ri:refund-line	74	t	t	f	\N	f	2026-06-01 02:04:33.051	2026-06-05 07:38:06.815	1
16	9	application	Application	/business/common-list	进件管理	ri:file-edit-line	68	t	t	f	\N	f	2026-06-01 02:04:33.038	2026-06-05 07:38:06.787	1
15	9	customer	Customer	/business/common-list	客户管理	ri:contacts-line	67	t	t	f	\N	f	2026-06-01 02:04:33.035	2026-06-05 07:38:06.784	1
59	9	pawn	PawnBusiness	/business/common-list	典当业务	ri:swap-box-line	75	t	t	f	\N	f	2026-06-01 08:12:51.221	2026-06-05 07:38:06.82	1
301	9	pre-entry	PreEntry	/business/common-list	预审进件	ri:file-edit-line	67	t	t	f	\N	f	2026-06-03 10:50:25.312	2026-06-03 10:50:25.312	1
302	9	risk-pre	RiskPre	/business/common-list	风控模型预审	ri:robot-2-line	68	t	t	f	\N	f	2026-06-03 10:50:25.316	2026-06-03 10:50:25.316	1
303	9	funder-pre	FunderPre	/business/common-list	资方预审	ri:bank-card-line	69	t	t	f	\N	f	2026-06-03 10:50:25.32	2026-06-03 10:50:25.32	1
304	9	supplement	Supplement	/business/common-list	资料补充	ri:folder-upload-line	70	t	t	f	\N	f	2026-06-03 10:50:25.323	2026-06-03 10:50:25.323	1
305	9	first-review	FirstReview	/business/common-list	风控初审	ri:shield-check-line	71	t	t	f	\N	f	2026-06-03 10:50:25.326	2026-06-03 10:50:25.326	1
306	9	final-review	FinalReview	/business/common-list	风控终审	ri:verified-badge-line	72	t	t	f	\N	f	2026-06-03 10:50:25.329	2026-06-03 10:50:25.329	1
307	9	loan-request	LoanRequest	/business/common-list	请款资料	ri:file-paper-2-line	73	t	t	f	\N	f	2026-06-03 10:50:25.333	2026-06-03 10:50:25.333	1
308	9	funder-final	FunderFinal	/business/common-list	资方终审	ri:bank-line	74	t	t	f	\N	f	2026-06-03 10:50:25.336	2026-06-03 10:50:25.336	1
309	9	disbursement-node	DisbursementNode	/business/common-list	资方放款	ri:money-cny-circle-line	75	t	t	f	\N	f	2026-06-03 10:50:25.34	2026-06-03 10:50:25.34	1
353	9	order-query	BusinessOrderQuery	/business/common-list	综合查询	ri:search-eye-line	69	t	t	f	\N	f	2026-06-05 07:38:06.791	2026-06-05 07:38:06.791	1
362	9	precheck	BusinessPrecheck	/business/common-list	预审阶段	ri:file-search-line	61	t	f	f	\N	f	2026-06-05 09:03:57.87	2026-06-05 09:03:57.87	1
363	9	supplement	BusinessSupplement	/business/common-list	补件阶段	ri:folder-upload-line	62	t	f	f	\N	f	2026-06-05 09:03:57.87	2026-06-05 09:03:57.87	1
364	9	risk-approval	BusinessRiskApproval	/business/common-list	风控审批	ri:shield-check-line	63	t	f	f	\N	f	2026-06-05 09:03:57.87	2026-06-05 09:03:57.87	1
365	9	funder-final	BusinessFunderFinal	/business/common-list	资方终审	ri:bank-line	64	t	f	f	\N	f	2026-06-05 09:03:57.87	2026-06-05 09:03:57.87	1
366	9	signing	BusinessSigning	/business/common-list	客户签约	ri:contract-line	65	t	f	f	\N	f	2026-06-05 09:03:57.87	2026-06-05 09:03:57.87	1
367	9	disbursement	BusinessDisbursement	/business/common-list	请款放款	ri:money-cny-circle-line	66	t	f	f	\N	f	2026-06-05 09:03:57.87	2026-06-05 09:03:57.87	1
13	24	funder	Funder	/business/common-list	资方配置	ri:bank-line	70	t	f	f	\N	f	2026-06-01 02:04:33.027	2026-06-05 09:08:45.717	1
50	24	flow-config	FlowConfig	/business/flow-config	流程与规则	ri:git-branch-line	71	t	f	f	\N	f	2026-06-01 08:12:51.191	2026-06-05 09:08:45.717	1
10	24	org	Org	/business/common-list	机构管理	ri:building-line	67	t	f	f	\N	f	2026-06-01 02:04:33.016	2026-06-05 09:08:45.717	1
11	24	dept	Dept	/business/common-list	部门管理	ri:organization-chart	68	t	f	f	\N	f	2026-06-01 02:04:33.02	2026-06-05 09:08:45.717	1
12	24	product	Product	/business/common-list	产品配置	ri:file-list-line	69	t	f	f	\N	f	2026-06-01 02:04:33.022	2026-06-05 09:08:45.717	1
\.


--
-- Data for Name: backup_Permission_20260615032504; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."backup_Permission_20260615032504" (id, "menuId", title, "authMark", "createdAt", "updatedAt", "tenantId") FROM stdin;
27	17	Delete	delete	2026-06-01 02:04:33.123	2026-06-05 07:38:07.12	1
28	18	Add	add	2026-06-01 02:04:33.125	2026-06-05 07:38:07.122	1
29	18	Edit	edit	2026-06-01 02:04:33.127	2026-06-05 07:38:07.125	1
36	20	Delete	delete	2026-06-01 02:04:33.144	2026-06-05 07:38:07.159	1
100	59	Add	add	2026-06-01 08:12:51.488	2026-06-05 07:38:07.162	1
104	60	Edit	edit	2026-06-01 08:12:51.497	2026-06-05 07:38:07.174	1
105	60	Delete	delete	2026-06-01 08:12:51.499	2026-06-05 07:38:07.177	1
106	61	Add	add	2026-06-01 08:12:51.501	2026-06-05 07:38:07.181	1
107	61	Edit	edit	2026-06-01 08:12:51.503	2026-06-05 07:38:07.184	1
3	7	Delete	delete	2026-06-01 02:04:33.062	2026-06-05 07:38:07.195	1
112	38	Add	add	2026-06-01 08:12:51.513	2026-06-05 07:38:07.199	1
113	38	Edit	edit	2026-06-01 08:12:51.514	2026-06-05 07:38:07.203	1
114	38	Delete	delete	2026-06-01 08:12:51.516	2026-06-05 07:38:07.207	1
117	39	Delete	delete	2026-06-01 08:12:51.522	2026-06-05 07:38:07.22	1
472	226	Add	add	2026-06-02 06:57:45.178	2026-06-05 07:38:07.224	1
473	226	Edit	edit	2026-06-02 06:57:45.178	2026-06-05 07:38:07.227	1
474	226	Delete	delete	2026-06-02 06:57:45.178	2026-06-05 07:38:07.231	1
118	41	Add	add	2026-06-01 08:12:51.523	2026-06-05 07:38:07.236	1
119	41	Edit	edit	2026-06-01 08:12:51.525	2026-06-05 07:38:07.243	1
120	41	Delete	delete	2026-06-01 08:12:51.527	2026-06-05 07:38:07.248	1
38	25	Edit	edit	2026-06-01 08:12:51.338	2026-06-05 07:38:06.943	1
39	25	Delete	delete	2026-06-01 08:12:51.343	2026-06-05 07:38:06.946	1
40	26	Add	add	2026-06-01 08:12:51.347	2026-06-05 07:38:06.95	1
41	26	Edit	edit	2026-06-01 08:12:51.349	2026-06-05 07:38:06.953	1
42	26	Delete	delete	2026-06-01 08:12:51.352	2026-06-05 07:38:06.958	1
43	27	Add	add	2026-06-01 08:12:51.356	2026-06-05 07:38:06.963	1
44	27	Edit	edit	2026-06-01 08:12:51.36	2026-06-05 07:38:06.968	1
45	27	Delete	delete	2026-06-01 08:12:51.362	2026-06-05 07:38:06.971	1
46	28	Add	add	2026-06-01 08:12:51.365	2026-06-05 07:38:06.975	1
47	28	Edit	edit	2026-06-01 08:12:51.367	2026-06-05 07:38:06.978	1
48	28	Delete	delete	2026-06-01 08:12:51.37	2026-06-05 07:38:06.982	1
49	29	Add	add	2026-06-01 08:12:51.375	2026-06-05 07:38:06.986	1
50	29	Edit	edit	2026-06-01 08:12:51.378	2026-06-05 07:38:06.99	1
51	29	Delete	delete	2026-06-01 08:12:51.382	2026-06-05 07:38:06.994	1
52	30	Add	add	2026-06-01 08:12:51.385	2026-06-05 07:38:06.998	1
53	30	Edit	edit	2026-06-01 08:12:51.389	2026-06-05 07:38:07.002	1
56	32	Edit	edit	2026-06-01 08:12:51.398	2026-06-05 07:38:07.014	1
57	32	Delete	delete	2026-06-01 08:12:51.401	2026-06-05 07:38:07.018	1
58	33	Add	add	2026-06-01 08:12:51.403	2026-06-05 07:38:07.021	1
11	12	Edit	edit	2026-06-01 02:04:33.082	2026-06-05 07:38:07.059	1
12	12	Delete	delete	2026-06-01 02:04:33.084	2026-06-05 07:38:07.062	1
13	13	Add	add	2026-06-01 02:04:33.086	2026-06-05 07:38:07.066	1
74	50	Edit	edit	2026-06-01 08:12:51.436	2026-06-05 07:38:07.08	1
75	50	Delete	delete	2026-06-01 08:12:51.438	2026-06-05 07:38:07.084	1
16	14	Add	add	2026-06-01 02:04:33.093	2026-06-05 07:38:07.087	1
21	15	Delete	delete	2026-06-01 02:04:33.109	2026-06-05 07:38:07.102	1
22	16	Add	add	2026-06-01 02:04:33.111	2026-06-05 07:38:07.104	1
23	16	Edit	edit	2026-06-01 02:04:33.113	2026-06-05 07:38:07.107	1
24	16	Delete	delete	2026-06-01 02:04:33.116	2026-06-05 07:38:07.11	1
25	17	Add	add	2026-06-01 02:04:33.119	2026-06-05 07:38:07.113	1
26	17	Edit	edit	2026-06-01 02:04:33.121	2026-06-05 07:38:07.117	1
30	18	Delete	delete	2026-06-01 02:04:33.13	2026-06-05 07:38:07.128	1
31	19	Add	add	2026-06-01 02:04:33.132	2026-06-05 07:38:07.132	1
32	19	Edit	edit	2026-06-01 02:04:33.135	2026-06-05 07:38:07.136	1
33	19	Delete	delete	2026-06-01 02:04:33.137	2026-06-05 07:38:07.138	1
94	57	Add	add	2026-06-01 08:12:51.477	2026-06-05 07:38:07.142	1
95	57	Edit	edit	2026-06-01 08:12:51.479	2026-06-05 07:38:07.146	1
96	57	Delete	delete	2026-06-01 08:12:51.481	2026-06-05 07:38:07.15	1
34	20	Add	add	2026-06-01 02:04:33.139	2026-06-05 07:38:07.153	1
35	20	Edit	edit	2026-06-01 02:04:33.142	2026-06-05 07:38:07.156	1
101	59	Edit	edit	2026-06-01 08:12:51.49	2026-06-05 07:38:07.166	1
102	59	Delete	delete	2026-06-01 08:12:51.492	2026-06-05 07:38:07.169	1
103	60	Add	add	2026-06-01 08:12:51.495	2026-06-05 07:38:07.172	1
108	61	Delete	delete	2026-06-01 08:12:51.506	2026-06-05 07:38:07.186	1
1	7	Add	add	2026-06-01 02:04:33.054	2026-06-05 07:38:07.188	1
2	7	Edit	edit	2026-06-01 02:04:33.059	2026-06-05 07:38:07.191	1
115	39	Add	add	2026-06-01 08:12:51.518	2026-06-05 07:38:07.211	1
116	39	Edit	edit	2026-06-01 08:12:51.52	2026-06-05 07:38:07.215	1
121	43	Add	add	2026-06-01 08:12:51.529	2026-06-05 07:38:07.252	1
122	43	Edit	edit	2026-06-01 08:12:51.531	2026-06-05 07:38:07.257	1
54	30	Delete	delete	2026-06-01 08:12:51.392	2026-06-05 07:38:07.005	1
55	32	Add	add	2026-06-01 08:12:51.395	2026-06-05 07:38:07.009	1
59	33	Edit	edit	2026-06-01 08:12:51.406	2026-06-05 07:38:07.025	1
60	33	Delete	delete	2026-06-01 08:12:51.408	2026-06-05 07:38:07.03	1
4	10	Add	add	2026-06-01 02:04:33.065	2026-06-05 07:38:07.035	1
5	10	Edit	edit	2026-06-01 02:04:33.067	2026-06-05 07:38:07.038	1
6	10	Delete	delete	2026-06-01 02:04:33.07	2026-06-05 07:38:07.042	1
7	11	Add	add	2026-06-01 02:04:33.072	2026-06-05 07:38:07.047	1
8	11	Edit	edit	2026-06-01 02:04:33.074	2026-06-05 07:38:07.051	1
9	11	Delete	delete	2026-06-01 02:04:33.076	2026-06-05 07:38:07.053	1
10	12	Add	add	2026-06-01 02:04:33.079	2026-06-05 07:38:07.056	1
14	13	Edit	edit	2026-06-01 02:04:33.088	2026-06-05 07:38:07.07	1
15	13	Delete	delete	2026-06-01 02:04:33.091	2026-06-05 07:38:07.074	1
73	50	Add	add	2026-06-01 08:12:51.434	2026-06-05 07:38:07.077	1
17	14	Edit	edit	2026-06-01 02:04:33.097	2026-06-05 07:38:07.089	1
18	14	Delete	delete	2026-06-01 02:04:33.101	2026-06-05 07:38:07.092	1
19	15	Add	add	2026-06-01 02:04:33.104	2026-06-05 07:38:07.095	1
20	15	Edit	edit	2026-06-01 02:04:33.106	2026-06-05 07:38:07.098	1
123	43	Delete	delete	2026-06-01 08:12:51.533	2026-06-05 07:38:07.262	1
37	25	Add	add	2026-06-01 08:12:51.332	2026-06-05 07:38:06.937	1
607	301	Add	add	2026-06-03 10:50:25.497	2026-06-03 10:50:25.497	1
608	301	Edit	edit	2026-06-03 10:50:25.502	2026-06-03 10:50:25.502	1
609	301	Delete	delete	2026-06-03 10:50:25.506	2026-06-03 10:50:25.506	1
610	302	Add	add	2026-06-03 10:50:25.51	2026-06-03 10:50:25.51	1
611	302	Edit	edit	2026-06-03 10:50:25.512	2026-06-03 10:50:25.512	1
612	302	Delete	delete	2026-06-03 10:50:25.515	2026-06-03 10:50:25.515	1
613	303	Add	add	2026-06-03 10:50:25.517	2026-06-03 10:50:25.517	1
614	303	Edit	edit	2026-06-03 10:50:25.521	2026-06-03 10:50:25.521	1
615	303	Delete	delete	2026-06-03 10:50:25.524	2026-06-03 10:50:25.524	1
616	304	Add	add	2026-06-03 10:50:25.527	2026-06-03 10:50:25.527	1
617	304	Edit	edit	2026-06-03 10:50:25.53	2026-06-03 10:50:25.53	1
618	304	Delete	delete	2026-06-03 10:50:25.535	2026-06-03 10:50:25.535	1
619	305	Add	add	2026-06-03 10:50:25.539	2026-06-03 10:50:25.539	1
620	305	Edit	edit	2026-06-03 10:50:25.541	2026-06-03 10:50:25.541	1
621	305	Delete	delete	2026-06-03 10:50:25.543	2026-06-03 10:50:25.543	1
622	306	Add	add	2026-06-03 10:50:25.545	2026-06-03 10:50:25.545	1
623	306	Edit	edit	2026-06-03 10:50:25.548	2026-06-03 10:50:25.548	1
624	306	Delete	delete	2026-06-03 10:50:25.552	2026-06-03 10:50:25.552	1
625	307	Add	add	2026-06-03 10:50:25.556	2026-06-03 10:50:25.556	1
626	307	Edit	edit	2026-06-03 10:50:25.558	2026-06-03 10:50:25.558	1
627	307	Delete	delete	2026-06-03 10:50:25.561	2026-06-03 10:50:25.561	1
628	308	Add	add	2026-06-03 10:50:25.563	2026-06-03 10:50:25.563	1
629	308	Edit	edit	2026-06-03 10:50:25.566	2026-06-03 10:50:25.566	1
630	308	Delete	delete	2026-06-03 10:50:25.57	2026-06-03 10:50:25.57	1
631	309	Add	add	2026-06-03 10:50:25.574	2026-06-03 10:50:25.574	1
632	309	Edit	edit	2026-06-03 10:50:25.578	2026-06-03 10:50:25.578	1
633	309	Delete	delete	2026-06-03 10:50:25.581	2026-06-03 10:50:25.581	1
\.


--
-- Data for Name: backup_RoleMenu_20260615032504; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."backup_RoleMenu_20260615032504" ("roleId", "menuId") FROM stdin;
1	24
6	24
3	1
3	2
3	3
3	24
3	25
3	26
3	27
3	28
3	29
3	30
3	31
3	32
3	33
3	4
3	5
3	6
3	7
3	38
3	39
3	226
3	40
3	41
3	42
3	43
3	8
3	9
3	10
3	11
3	12
3	13
3	50
3	14
3	15
3	16
3	353
3	17
3	18
3	19
3	57
3	20
3	59
3	60
3	61
10	1
10	2
10	3
10	24
10	25
10	26
10	27
10	28
10	29
10	30
10	31
10	32
10	33
10	43
10	9
10	14
10	15
10	16
10	17
10	19
10	20
6	1
6	2
6	3
6	4
6	5
6	6
6	7
6	226
6	8
6	9
6	10
6	11
6	12
6	13
6	50
6	14
6	15
6	16
6	17
6	18
6	19
6	57
6	20
6	59
6	60
6	61
1	1
1	2
1	3
1	9
1	10
1	11
1	50
1	14
1	15
1	16
1	17
1	18
1	19
1	57
1	20
1	60
4	1
4	2
4	3
4	9
4	14
4	15
4	16
4	18
2	1
2	2
2	3
2	9
2	16
2	17
7	1
7	2
7	3
7	9
7	19
7	57
7	20
7	60
16	1
16	2
16	3
16	9
16	15
16	20
16	60
5	1
5	2
5	3
\.


--
-- Data for Name: backup_RolePermission_20260615032504; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."backup_RolePermission_20260615032504" ("roleId", "permissionId") FROM stdin;
\.


--
-- Name: ApplicationFile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ApplicationFile_id_seq"', 201, true);


--
-- Name: Application_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Application_id_seq"', 4, true);


--
-- Name: ApprovalRecord_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ApprovalRecord_id_seq"', 2, true);


--
-- Name: BankCard_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."BankCard_id_seq"', 1, true);


--
-- Name: CustomerContact_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."CustomerContact_id_seq"', 1, true);


--
-- Name: Customer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Customer_id_seq"', 4, true);


--
-- Name: Department_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Department_id_seq"', 4, true);


--
-- Name: DictData_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."DictData_id_seq"', 4, true);


--
-- Name: DictType_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."DictType_id_seq"', 4, true);


--
-- Name: Disbursement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Disbursement_id_seq"', 2, true);


--
-- Name: FileAsset_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."FileAsset_id_seq"', 71, true);


--
-- Name: FlowConfig_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."FlowConfig_id_seq"', 91, true);


--
-- Name: Funder_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Funder_id_seq"', 2, true);


--
-- Name: LeadFollowUp_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."LeadFollowUp_id_seq"', 1, true);


--
-- Name: Lead_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Lead_id_seq"', 1, true);


--
-- Name: Menu_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Menu_id_seq"', 205, true);


--
-- Name: OperationLog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."OperationLog_id_seq"', 149, true);


--
-- Name: Organization_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Organization_id_seq"', 6, true);


--
-- Name: Permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Permission_id_seq"', 327, true);


--
-- Name: Product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Product_id_seq"', 1, true);


--
-- Name: RepaymentPlan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."RepaymentPlan_id_seq"', 2, true);


--
-- Name: RepaymentRecord_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."RepaymentRecord_id_seq"', 1, false);


--
-- Name: Role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Role_id_seq"', 89, true);


--
-- Name: SignRecord_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."SignRecord_id_seq"', 2, true);


--
-- Name: Tenant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Tenant_id_seq"', 1, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."User_id_seq"', 15, true);


--
-- Name: Vehicle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Vehicle_id_seq"', 2, true);


--
-- Name: ApplicationFile ApplicationFile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ApplicationFile"
    ADD CONSTRAINT "ApplicationFile_pkey" PRIMARY KEY (id);


--
-- Name: Application Application_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_pkey" PRIMARY KEY (id);


--
-- Name: ApprovalRecord ApprovalRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ApprovalRecord"
    ADD CONSTRAINT "ApprovalRecord_pkey" PRIMARY KEY (id);


--
-- Name: BankCard BankCard_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BankCard"
    ADD CONSTRAINT "BankCard_pkey" PRIMARY KEY (id);


--
-- Name: CustomerContact CustomerContact_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CustomerContact"
    ADD CONSTRAINT "CustomerContact_pkey" PRIMARY KEY (id);


--
-- Name: Customer Customer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_pkey" PRIMARY KEY (id);


--
-- Name: Department Department_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_pkey" PRIMARY KEY (id);


--
-- Name: DictData DictData_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DictData"
    ADD CONSTRAINT "DictData_pkey" PRIMARY KEY (id);


--
-- Name: DictType DictType_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DictType"
    ADD CONSTRAINT "DictType_pkey" PRIMARY KEY (id);


--
-- Name: Disbursement Disbursement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Disbursement"
    ADD CONSTRAINT "Disbursement_pkey" PRIMARY KEY (id);


--
-- Name: FileAsset FileAsset_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FileAsset"
    ADD CONSTRAINT "FileAsset_pkey" PRIMARY KEY (id);


--
-- Name: FlowConfig FlowConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FlowConfig"
    ADD CONSTRAINT "FlowConfig_pkey" PRIMARY KEY (id);


--
-- Name: Funder Funder_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Funder"
    ADD CONSTRAINT "Funder_pkey" PRIMARY KEY (id);


--
-- Name: LeadFollowUp LeadFollowUp_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LeadFollowUp"
    ADD CONSTRAINT "LeadFollowUp_pkey" PRIMARY KEY (id);


--
-- Name: Lead Lead_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_pkey" PRIMARY KEY (id);


--
-- Name: Menu Menu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Menu"
    ADD CONSTRAINT "Menu_pkey" PRIMARY KEY (id);


--
-- Name: OperationLog OperationLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OperationLog"
    ADD CONSTRAINT "OperationLog_pkey" PRIMARY KEY (id);


--
-- Name: Organization Organization_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Organization"
    ADD CONSTRAINT "Organization_pkey" PRIMARY KEY (id);


--
-- Name: Permission Permission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: RepaymentPlan RepaymentPlan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RepaymentPlan"
    ADD CONSTRAINT "RepaymentPlan_pkey" PRIMARY KEY (id);


--
-- Name: RepaymentRecord RepaymentRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RepaymentRecord"
    ADD CONSTRAINT "RepaymentRecord_pkey" PRIMARY KEY (id);


--
-- Name: RoleMenu RoleMenu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RoleMenu"
    ADD CONSTRAINT "RoleMenu_pkey" PRIMARY KEY ("roleId", "menuId");


--
-- Name: RolePermission RolePermission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionId");


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: SignRecord SignRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SignRecord"
    ADD CONSTRAINT "SignRecord_pkey" PRIMARY KEY (id);


--
-- Name: Tenant Tenant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Tenant"
    ADD CONSTRAINT "Tenant_pkey" PRIMARY KEY (id);


--
-- Name: UserRole UserRole_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId", "roleId");


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Vehicle Vehicle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Vehicle"
    ADD CONSTRAINT "Vehicle_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: ApplicationFile_applicationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ApplicationFile_applicationId_idx" ON public."ApplicationFile" USING btree ("applicationId");


--
-- Name: ApplicationFile_fileType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ApplicationFile_fileType_idx" ON public."ApplicationFile" USING btree ("fileType");


--
-- Name: Application_applicationNo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Application_applicationNo_idx" ON public."Application" USING btree ("applicationNo");


--
-- Name: Application_applicationNo_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Application_applicationNo_key" ON public."Application" USING btree ("applicationNo");


--
-- Name: Application_businessType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Application_businessType_idx" ON public."Application" USING btree ("businessType");


--
-- Name: Application_creatorId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Application_creatorId_idx" ON public."Application" USING btree ("creatorId");


--
-- Name: Application_currentNode_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Application_currentNode_idx" ON public."Application" USING btree ("currentNode");


--
-- Name: Application_currentStatus_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Application_currentStatus_idx" ON public."Application" USING btree ("currentStatus");


--
-- Name: Application_customerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Application_customerId_idx" ON public."Application" USING btree ("customerId");


--
-- Name: Application_orgId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Application_orgId_idx" ON public."Application" USING btree ("orgId");


--
-- Name: Application_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Application_status_idx" ON public."Application" USING btree (status);


--
-- Name: Application_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Application_tenantId_idx" ON public."Application" USING btree ("tenantId");


--
-- Name: ApprovalRecord_applicationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ApprovalRecord_applicationId_idx" ON public."ApprovalRecord" USING btree ("applicationId");


--
-- Name: ApprovalRecord_approverId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ApprovalRecord_approverId_idx" ON public."ApprovalRecord" USING btree ("approverId");


--
-- Name: ApprovalRecord_stage_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ApprovalRecord_stage_idx" ON public."ApprovalRecord" USING btree (stage);


--
-- Name: ApprovalRecord_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ApprovalRecord_tenantId_idx" ON public."ApprovalRecord" USING btree ("tenantId");


--
-- Name: BankCard_customerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "BankCard_customerId_idx" ON public."BankCard" USING btree ("customerId");


--
-- Name: CustomerContact_customerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CustomerContact_customerId_idx" ON public."CustomerContact" USING btree ("customerId");


--
-- Name: Customer_idCard_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Customer_idCard_idx" ON public."Customer" USING btree ("idCard");


--
-- Name: Customer_orgId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Customer_orgId_idx" ON public."Customer" USING btree ("orgId");


--
-- Name: Customer_orgId_phone_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Customer_orgId_phone_key" ON public."Customer" USING btree ("orgId", phone);


--
-- Name: Customer_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Customer_tenantId_idx" ON public."Customer" USING btree ("tenantId");


--
-- Name: Department_orgId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Department_orgId_idx" ON public."Department" USING btree ("orgId");


--
-- Name: Department_orgId_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Department_orgId_name_key" ON public."Department" USING btree ("orgId", name);


--
-- Name: Department_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Department_tenantId_idx" ON public."Department" USING btree ("tenantId");


--
-- Name: DictData_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DictData_status_idx" ON public."DictData" USING btree (status);


--
-- Name: DictData_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DictData_tenantId_idx" ON public."DictData" USING btree ("tenantId");


--
-- Name: DictData_tenantId_typeId_value_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DictData_tenantId_typeId_value_key" ON public."DictData" USING btree ("tenantId", "typeId", value);


--
-- Name: DictData_typeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DictData_typeId_idx" ON public."DictData" USING btree ("typeId");


--
-- Name: DictType_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DictType_status_idx" ON public."DictType" USING btree (status);


--
-- Name: DictType_tenantId_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "DictType_tenantId_code_key" ON public."DictType" USING btree ("tenantId", code);


--
-- Name: DictType_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "DictType_tenantId_idx" ON public."DictType" USING btree ("tenantId");


--
-- Name: Disbursement_applicationId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Disbursement_applicationId_key" ON public."Disbursement" USING btree ("applicationId");


--
-- Name: Disbursement_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Disbursement_tenantId_idx" ON public."Disbursement" USING btree ("tenantId");


--
-- Name: FileAsset_businessType_businessId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FileAsset_businessType_businessId_idx" ON public."FileAsset" USING btree ("businessType", "businessId");


--
-- Name: FileAsset_categoryCode_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FileAsset_categoryCode_idx" ON public."FileAsset" USING btree ("categoryCode");


--
-- Name: FileAsset_orgId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FileAsset_orgId_idx" ON public."FileAsset" USING btree ("orgId");


--
-- Name: FileAsset_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FileAsset_status_idx" ON public."FileAsset" USING btree (status);


--
-- Name: FileAsset_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FileAsset_tenantId_idx" ON public."FileAsset" USING btree ("tenantId");


--
-- Name: FileAsset_uploadedBy_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FileAsset_uploadedBy_idx" ON public."FileAsset" USING btree ("uploadedBy");


--
-- Name: FlowConfig_businessType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FlowConfig_businessType_idx" ON public."FlowConfig" USING btree ("businessType");


--
-- Name: FlowConfig_nodeCode_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FlowConfig_nodeCode_idx" ON public."FlowConfig" USING btree ("nodeCode");


--
-- Name: FlowConfig_orgId_businessType_nodeCode_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "FlowConfig_orgId_businessType_nodeCode_key" ON public."FlowConfig" USING btree ("orgId", "businessType", "nodeCode");


--
-- Name: FlowConfig_orgId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FlowConfig_orgId_idx" ON public."FlowConfig" USING btree ("orgId");


--
-- Name: FlowConfig_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FlowConfig_status_idx" ON public."FlowConfig" USING btree (status);


--
-- Name: FlowConfig_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FlowConfig_tenantId_idx" ON public."FlowConfig" USING btree ("tenantId");


--
-- Name: Funder_orgId_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Funder_orgId_code_key" ON public."Funder" USING btree ("orgId", code);


--
-- Name: Funder_orgId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Funder_orgId_idx" ON public."Funder" USING btree ("orgId");


--
-- Name: Funder_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Funder_tenantId_idx" ON public."Funder" USING btree ("tenantId");


--
-- Name: LeadFollowUp_leadId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LeadFollowUp_leadId_idx" ON public."LeadFollowUp" USING btree ("leadId");


--
-- Name: Lead_assigneeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Lead_assigneeId_idx" ON public."Lead" USING btree ("assigneeId");


--
-- Name: Lead_orgId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Lead_orgId_idx" ON public."Lead" USING btree ("orgId");


--
-- Name: Lead_phone_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Lead_phone_idx" ON public."Lead" USING btree (phone);


--
-- Name: Lead_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Lead_status_idx" ON public."Lead" USING btree (status);


--
-- Name: Lead_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Lead_tenantId_idx" ON public."Lead" USING btree ("tenantId");


--
-- Name: Menu_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Menu_tenantId_idx" ON public."Menu" USING btree ("tenantId");


--
-- Name: Menu_tenantId_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Menu_tenantId_name_key" ON public."Menu" USING btree ("tenantId", name);


--
-- Name: OperationLog_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OperationLog_createdAt_idx" ON public."OperationLog" USING btree ("createdAt");


--
-- Name: OperationLog_module_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OperationLog_module_idx" ON public."OperationLog" USING btree (module);


--
-- Name: OperationLog_orgId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OperationLog_orgId_idx" ON public."OperationLog" USING btree ("orgId");


--
-- Name: OperationLog_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OperationLog_tenantId_idx" ON public."OperationLog" USING btree ("tenantId");


--
-- Name: OperationLog_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "OperationLog_userId_idx" ON public."OperationLog" USING btree ("userId");


--
-- Name: Organization_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Organization_code_key" ON public."Organization" USING btree (code);


--
-- Name: Organization_creditCode_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Organization_creditCode_key" ON public."Organization" USING btree ("creditCode");


--
-- Name: Organization_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Organization_status_idx" ON public."Organization" USING btree (status);


--
-- Name: Organization_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Organization_tenantId_idx" ON public."Organization" USING btree ("tenantId");


--
-- Name: Permission_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Permission_tenantId_idx" ON public."Permission" USING btree ("tenantId");


--
-- Name: Permission_tenantId_menuId_authMark_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Permission_tenantId_menuId_authMark_key" ON public."Permission" USING btree ("tenantId", "menuId", "authMark");


--
-- Name: Product_orgId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_orgId_idx" ON public."Product" USING btree ("orgId");


--
-- Name: Product_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_status_idx" ON public."Product" USING btree (status);


--
-- Name: Product_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_tenantId_idx" ON public."Product" USING btree ("tenantId");


--
-- Name: RepaymentPlan_applicationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RepaymentPlan_applicationId_idx" ON public."RepaymentPlan" USING btree ("applicationId");


--
-- Name: RepaymentPlan_applicationId_period_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "RepaymentPlan_applicationId_period_key" ON public."RepaymentPlan" USING btree ("applicationId", period);


--
-- Name: RepaymentPlan_dueDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RepaymentPlan_dueDate_idx" ON public."RepaymentPlan" USING btree ("dueDate");


--
-- Name: RepaymentPlan_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RepaymentPlan_status_idx" ON public."RepaymentPlan" USING btree (status);


--
-- Name: RepaymentPlan_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RepaymentPlan_tenantId_idx" ON public."RepaymentPlan" USING btree ("tenantId");


--
-- Name: RepaymentRecord_planId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RepaymentRecord_planId_idx" ON public."RepaymentRecord" USING btree ("planId");


--
-- Name: RepaymentRecord_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RepaymentRecord_tenantId_idx" ON public."RepaymentRecord" USING btree ("tenantId");


--
-- Name: Role_tenantId_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Role_tenantId_code_key" ON public."Role" USING btree ("tenantId", code);


--
-- Name: Role_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Role_tenantId_idx" ON public."Role" USING btree ("tenantId");


--
-- Name: SignRecord_applicationId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SignRecord_applicationId_key" ON public."SignRecord" USING btree ("applicationId");


--
-- Name: SignRecord_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SignRecord_tenantId_idx" ON public."SignRecord" USING btree ("tenantId");


--
-- Name: Tenant_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Tenant_code_key" ON public."Tenant" USING btree (code);


--
-- Name: User_deptId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_deptId_idx" ON public."User" USING btree ("deptId");


--
-- Name: User_tenantId_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_tenantId_email_key" ON public."User" USING btree ("tenantId", email);


--
-- Name: User_tenantId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_tenantId_idx" ON public."User" USING btree ("tenantId");


--
-- Name: User_tenantId_userName_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_tenantId_userName_key" ON public."User" USING btree ("tenantId", "userName");


--
-- Name: Vehicle_customerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Vehicle_customerId_idx" ON public."Vehicle" USING btree ("customerId");


--
-- Name: Vehicle_vin_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Vehicle_vin_idx" ON public."Vehicle" USING btree (vin);


--
-- Name: ApplicationFile ApplicationFile_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ApplicationFile"
    ADD CONSTRAINT "ApplicationFile_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."Application"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Application Application_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Application Application_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Application Application_funderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_funderId_fkey" FOREIGN KEY ("funderId") REFERENCES public."Funder"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Application Application_orgId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Application Application_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Application Application_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Application"
    ADD CONSTRAINT "Application_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ApprovalRecord ApprovalRecord_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ApprovalRecord"
    ADD CONSTRAINT "ApprovalRecord_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."Application"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ApprovalRecord ApprovalRecord_approverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ApprovalRecord"
    ADD CONSTRAINT "ApprovalRecord_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ApprovalRecord ApprovalRecord_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ApprovalRecord"
    ADD CONSTRAINT "ApprovalRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BankCard BankCard_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BankCard"
    ADD CONSTRAINT "BankCard_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CustomerContact CustomerContact_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CustomerContact"
    ADD CONSTRAINT "CustomerContact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Customer Customer_orgId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Customer Customer_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Department Department_orgId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Department Department_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Department Department_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DictData DictData_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DictData"
    ADD CONSTRAINT "DictData_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DictData DictData_typeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DictData"
    ADD CONSTRAINT "DictData_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES public."DictType"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DictType DictType_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DictType"
    ADD CONSTRAINT "DictType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Disbursement Disbursement_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Disbursement"
    ADD CONSTRAINT "Disbursement_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."Application"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Disbursement Disbursement_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Disbursement"
    ADD CONSTRAINT "Disbursement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FileAsset FileAsset_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FileAsset"
    ADD CONSTRAINT "FileAsset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FlowConfig FlowConfig_orgId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FlowConfig"
    ADD CONSTRAINT "FlowConfig_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FlowConfig FlowConfig_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FlowConfig"
    ADD CONSTRAINT "FlowConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Funder Funder_orgId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Funder"
    ADD CONSTRAINT "Funder_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Funder Funder_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Funder"
    ADD CONSTRAINT "Funder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LeadFollowUp LeadFollowUp_leadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LeadFollowUp"
    ADD CONSTRAINT "LeadFollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES public."Lead"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Lead Lead_assigneeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Lead Lead_orgId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Lead Lead_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Menu Menu_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Menu"
    ADD CONSTRAINT "Menu_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Menu"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Menu Menu_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Menu"
    ADD CONSTRAINT "Menu_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Organization Organization_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Organization"
    ADD CONSTRAINT "Organization_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Permission Permission_menuId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES public."Menu"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Permission Permission_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Product Product_orgId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Product Product_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RepaymentPlan RepaymentPlan_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RepaymentPlan"
    ADD CONSTRAINT "RepaymentPlan_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."Application"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RepaymentPlan RepaymentPlan_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RepaymentPlan"
    ADD CONSTRAINT "RepaymentPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RepaymentRecord RepaymentRecord_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RepaymentRecord"
    ADD CONSTRAINT "RepaymentRecord_planId_fkey" FOREIGN KEY ("planId") REFERENCES public."RepaymentPlan"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RepaymentRecord RepaymentRecord_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RepaymentRecord"
    ADD CONSTRAINT "RepaymentRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RoleMenu RoleMenu_menuId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RoleMenu"
    ADD CONSTRAINT "RoleMenu_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES public."Menu"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RoleMenu RoleMenu_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RoleMenu"
    ADD CONSTRAINT "RoleMenu_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RolePermission RolePermission_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public."Permission"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RolePermission RolePermission_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Role Role_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SignRecord SignRecord_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SignRecord"
    ADD CONSTRAINT "SignRecord_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."Application"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SignRecord SignRecord_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SignRecord"
    ADD CONSTRAINT "SignRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserRole UserRole_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserRole UserRole_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserRole"
    ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_deptId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_deptId_fkey" FOREIGN KEY ("deptId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Vehicle Vehicle_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Vehicle"
    ADD CONSTRAINT "Vehicle_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict d5Zb6H30dOAr5frx8O7IHNTLYvbsnOC2yCPC4SSrnyCwIOyKeE2rHEodp5wRqhK


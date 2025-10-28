"""Custom middlewares for DevPulse."""

from scrapy import signals
from scrapy.http import Request, Response


class DevpulseSpiderMiddleware:
    """
    Spider middleware for custom spider processing.

    This middleware can be used to process spider input (responses) and
    output (items and requests).
    """

    @classmethod
    def from_crawler(cls, crawler):
        """
        Create middleware instance from crawler.

        Args:
            crawler: Scrapy crawler

        Returns:
            Middleware instance
        """
        s = cls()
        crawler.signals.connect(s.spider_opened, signal=signals.spider_opened)
        return s

    def process_spider_input(self, response: Response, spider):
        """
        Process spider input (responses).

        Args:
            response: Response being processed
            spider: Spider processing the response

        Returns:
            None
        """
        return None

    def process_spider_output(self, response: Response, result, spider):
        """
        Process spider output (items and requests).

        Args:
            response: Response that generated the result
            result: Items/requests yielded by the spider
            spider: Spider that generated the result

        Yields:
            Processed items/requests
        """
        for i in result:
            yield i

    def process_spider_exception(self, response: Response, exception: Exception, spider):
        """
        Handle exceptions raised during spider processing.

        Args:
            response: Response that caused the exception
            exception: Exception raised
            spider: Spider that raised the exception
        """
        pass

    def spider_opened(self, spider):
        """
        Called when spider is opened.

        Args:
            spider: Spider being opened
        """
        spider.logger.info(f"Spider opened: {spider.name}")


class DevpulseDownloaderMiddleware:
    """
    Downloader middleware for custom request/response processing.

    This middleware can be used to process requests before they're sent
    and responses before they reach the spider.
    """

    @classmethod
    def from_crawler(cls, crawler):
        """
        Create middleware instance from crawler.

        Args:
            crawler: Scrapy crawler

        Returns:
            Middleware instance
        """
        s = cls()
        crawler.signals.connect(s.spider_opened, signal=signals.spider_opened)
        return s

    def process_request(self, request: Request, spider):
        """
        Process requests before they're sent.

        Args:
            request: Request being processed
            spider: Spider sending the request

        Returns:
            None to continue processing, Response to short-circuit
        """
        return None

    def process_response(self, request: Request, response: Response, spider):
        """
        Process responses before they reach the spider.

        Args:
            request: Request that generated the response
            response: Response being processed
            spider: Spider that will receive the response

        Returns:
            Response or Request
        """
        return response

    def process_exception(self, request: Request, exception: Exception, spider):
        """
        Handle exceptions during request processing.

        Args:
            request: Request that caused the exception
            exception: Exception raised
            spider: Spider that sent the request
        """
        pass

    def spider_opened(self, spider):
        """
        Called when spider is opened.

        Args:
            spider: Spider being opened
        """
        spider.logger.info(f"Spider opened: {spider.name}")
